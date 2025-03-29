import { PaymentMethod } from "../enums/PaymentMethod";
import { PaymentProvider } from "../enums/PaymentProvider";
import { PaymentProviderType } from "../enums/PaymentProviderType";

export interface IPaymentMethod {
  id: string;
  method: PaymentMethod | string | undefined;
  description: string;
  provider: PaymentProvider | string | undefined;
  providerType: PaymentProviderType | string | undefined;
  businessNumber: string;
  accountNumber: string;
  accountName: string;
  created: Date;
  code?: string;
}

export const PAYMENT_METHOD: IPaymentMethod = {
  id: "",
  method: undefined,
  description: "",
  provider: undefined,
  providerType: undefined,
  businessNumber: "",
  accountNumber: "",
  accountName: "",
  created: new Date(),
};
