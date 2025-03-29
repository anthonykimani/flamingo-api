import { INotificationSetting } from "./INotificationSetting";
import { IPaymentMethod } from "./IPaymentMethod";

export interface IProfile {
    username: string;
    languageCode: string;
    currencyCode: string;
    shareAnalytics: boolean;
    viewAddressInfo: boolean;
    imgPath?: string;
    paymentMethod: Array<IPaymentMethod>;
    notifications: INotificationSetting[];
}

export interface IAddress {
    privateKey: string;
    publicKey: string;
    address: string;
    mnemonic: string;
    rsaPrivate: string;
    rsaPublic: string;
}
  