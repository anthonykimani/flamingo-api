import { NotificationSetting } from "../enums/NotificationSetting";

/**TODO: move to library when ready */
export interface INotificationSetting {
  notification: NotificationSetting;
  active: boolean;
}
