import { FC, useState } from "react";
import { Address, Hex } from "viem";
import { AlertInline, InputText } from "@aragon/ods";
import { PleaseWaitSpinner } from "@/components/please-wait";
import { isAddress } from "@/utils/evm";
import { Action } from "@/utils/types";
import { Else, ElseIf, If, Then } from "@/components/if";
import { useAbi } from "@/hooks/useAbi";
import { FunctionSelector } from "./function-selector";

interface FunctionCallFormProps {
  onAddAction: (action: Action) => any;
}
export const FunctionCallForm: FC<FunctionCallFormProps> = ({
  onAddAction,
}) => {
  const [targetContract, setTargetContract] = useState<string>("");
  const { abi, isLoading: loadingAbi } = useAbi(targetContract as Address);

  const actionEntered = (data: Hex, value: bigint) => {
    onAddAction({
      to: targetContract,
      value,
      data,
    });
  };

  return (
    <div className="my-6">
      <div className="mb-3">
        <InputText
          label="Contract address"
          placeholder="0x1234..."
          variant={
            !targetContract || isAddress(targetContract)
              ? "default"
              : "critical"
          }
          value={targetContract}
          onChange={(e) => setTargetContract(e.target.value || "")}
        />
      </div>
      <If condition={loadingAbi}>
        <Then>
          <div>
            <PleaseWaitSpinner />
          </div>
        </Then>
        <ElseIf not={targetContract}>
          <p>Enter the address of the contract to interact with</p>
        </ElseIf>
        <ElseIf not={isAddress(targetContract)}>
          <AlertInline
            message="The address of the contract is not valid"
            variant="critical"
          />
        </ElseIf>
        <ElseIf not={abi?.length}>
          <AlertInline
            message="The ABI of the contract is not publicly available"
            variant="critical"
          />
        </ElseIf>
        <Else>
          <FunctionSelector abi={abi} actionEntered={actionEntered} />
        </Else>
      </If>
    </div>
  );
};
