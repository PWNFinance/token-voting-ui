import Link from "next/link";
import { useProposalVeto } from "@/plugins/optimistic-proposals/hooks/useProposalVeto";
import { Card, ProposalDataListItemStructure, ProposalStatus } from "@aragon/gov-ui-kit";
import { ProposalDataListItem } from "@aragon/gov-ui-kit";
import { PleaseWaitSpinner } from "@/components/please-wait";
import { useProposalStatus } from "../../hooks/useProposalVariantStatus";
import { PUB_TOKEN_SYMBOL } from "@/constants";
import { useAccount } from "wagmi";
import { formatEther } from "viem";
import { useToken } from "../../hooks/useToken";

const DEFAULT_PROPOSAL_METADATA_TITLE = "(No proposal title)";
const DEFAULT_PROPOSAL_METADATA_SUMMARY = "(The metadata of the proposal is not available)";

type ProposalInputs = {
  proposalIndex: number;
};

export default function ProposalCard(props: ProposalInputs) {
  const { address } = useAccount();
  const { proposal, proposalFetchStatus, vetoes } = useProposalVeto(props.proposalIndex);
  const { symbol: tokenSymbol } = useToken();

  const proposalStatus = useProposalStatus(proposal!);
  const showLoading = getShowProposalLoading(proposal, proposalFetchStatus);
  const hasVetoed = vetoes?.some((veto) => veto.voter === address);

  if (!proposal && showLoading) {
    return (
      <section className="mb-4 w-full">
        <Card className="p-4">
          <span className="xs:px-10 px-4 py-5 md:px-6 lg:px-7">
            <PleaseWaitSpinner fullMessage="Loading proposal..." />
          </span>
        </Card>
      </section>
    );
  } else if (!proposal?.title && !proposal?.summary) {
    // We have the proposal but no metadata yet
    return (
      <Link href={`#/stewards/proposals/${props.proposalIndex}`} className="mb-4 w-full">
        <Card className="p-4">
          <span className="xs:px-10 px-4 py-5 md:px-6 lg:px-7">
            <PleaseWaitSpinner fullMessage="Loading metadata..." />
          </span>
        </Card>
      </Link>
    );
  } else if (proposalFetchStatus.metadataReady && !proposal?.title) {
    return (
      <Link href={`#/stewards/proposals/${props.proposalIndex}`} className="mb-4 w-full">
        <Card className="p-4">
          <div className="xl:4/5 overflow-hidden text-ellipsis text-nowrap pr-4 md:w-7/12 lg:w-3/4">
            <h4 className="mb-1 line-clamp-1 text-lg text-neutral-300">
              {Number(props.proposalIndex) + 1} - {DEFAULT_PROPOSAL_METADATA_TITLE}
            </h4>
            <p className="line-clamp-3 text-base text-neutral-300">{DEFAULT_PROPOSAL_METADATA_SUMMARY}</p>
          </div>
        </Card>
      </Link>
    );
  }

  let vetoPercentage = 0;
  if (proposal?.vetoTally && proposal.parameters.minVetoVotingPower) {
    vetoPercentage = Number(proposal.vetoTally / (proposal.parameters.minVetoVotingPower / 100n));
  }

  return (
    <ProposalDataListItemStructure
      title={proposal.title}
      summary={proposal.summary}
      href={`#/stewards/proposals/${props.proposalIndex}`}
      voted={hasVetoed}
      date={
        [ProposalStatus.ACTIVE, ProposalStatus.ACCEPTED].includes(proposalStatus!) && proposal.parameters.endDate
          ? Number(proposal.parameters.endDate) * 1000
          : undefined
      }
      result={{
        option: "Veto",
        voteAmount: formatEther(proposal.vetoTally) + " " + (tokenSymbol || PUB_TOKEN_SYMBOL),
        votePercentage: vetoPercentage,
        stage: {
          id: `${vetoPercentage}%`,
          title: "Proposal vetoes",
        },
      }}
      publisher={{ address: proposal.creator }}
      status={proposalStatus!}
      type={"majorityVoting"}
      className="customStewardsProposalCardWrapper"
    />
  );
}

function getShowProposalLoading(
  proposal: ReturnType<typeof useProposalVeto>["proposal"],
  status: ReturnType<typeof useProposalVeto>["proposalFetchStatus"]
) {
  if (!proposal || status.proposalLoading) return true;
  else if (status.metadataLoading && !status.metadataError) return true;
  else if (!proposal?.title && !status.metadataError) return true;

  return false;
}
