import { NotificationSetting } from "../../enums/NotificationSetting";
import { OnboardType } from "../../enums/OnboardType";
import { User } from "../../models/user.entity";

class Validator {
  /**
   * Errors Container
   */
  protected static errors: any = [];

  /**
   * Validate User Object
   * @param user User
   * @returns Array
   */
  public static isValidUser(user: User): [] {
    try {
      this.errors = [];
      let _onboardTypes = [OnboardType.NEW];
      let _notification = Object.keys(NotificationSetting).filter(
        (NotificationSetting) => NotificationSetting
      );

      /**
       * firstname
       */
      if (this.isEmpty(user.firstname))
        this.errors.push("Field 'firstname' is required");

      /**
       * lastname
       */
      if (this.isEmpty(user.lastname))
        this.errors.push("Field 'lastname' is required");

      return this.errors;
    } catch (error) {
      return [];
    }
  }

  /**
   * Checks if a value is empty
   * @param val string
   * @returns boolean
   */
  public static isEmpty(val: string): boolean {
    try {
      let _empty = false;

      if (val === undefined) _empty = true;
      if (val === null) _empty = true;
      if (!val) _empty = true;

      return _empty;
    } catch (error) {
      return false;
    }
  }
}

export default Validator;
