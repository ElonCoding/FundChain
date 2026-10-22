export interface CreatePoolFormState {
  title: string;
  description: string;
  poolType: "event" | "luckydraw";
  contribMode: "fixed" | "flexible";
  fixedAmount: string;
  minAmount: string;
  maxAmount: string;
  goalAmount: string;
  deadline: string;
  recipientAddr: string;
}
