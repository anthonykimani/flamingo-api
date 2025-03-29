import { Request, Response } from "express";
import { User } from "../models/user.entity";
import { UserRepository } from "../repositories/user.repo";
import Validator from "../utils/validators/validator";
import Controller from "./controller";

class UserController extends Controller {
  /**
   * Get User List
   * @param req Request
   * @param res Response
   * @returns Json Object
   */
  public static async users(req: Request, res: Response) {
    try {
      const repo: UserRepository = new UserRepository();
      let userData = await repo.getAll(req.body);

      if (userData) {
        return res.send(super.response(super._200, userData));
      } else {
        return res.send(
          super.response(super._404, userData, [super._404.message])
        );
      }
    } catch (error) {
      return res.send(super.response(super._500, null, super.ex(error)));
    }
  }

  /**
   * Get User By Id
   * @param req Request
   * @param res Response
   * @returns Json Object
   */
  public static async user(req: Request, res: Response) {
    try {
      const repo: UserRepository = new UserRepository();
      let { id } = req.body;

      let userData = await repo.getUserById(id);
      if (userData) {
        return res.send(super.response(super._200, userData));
      } else {
        return res.send(super.response(super._404, null, [super._404.message]));
      }
    } catch (error) {
      return res.send(super.response(super._500, null, super.ex(error)));
    }
  }

  /**
   * Add User
   * @param req Request
   * @param res Response
   * @returns Json Object
   */
  public static async add(req: Request, res: Response) {
    try {
      const repo: UserRepository = new UserRepository();

      const {
        address,
        profile,
        account,
        onboardType,
        firstname,
        middlename,
        lastname,
        phoneNumber,
        phoneNumberConfirmed,
        phoneNumberConfirmStatus,
        countryCode,
        email,
        emailConfirmed,
        emailConfirmStatus,
        password,
        regKey,
        registered,
        deviceId,
        browserId,
        twoFactorEnabled,
        lockoutEndDateUtc,
        lockoutEnabled,
        accessFailedCount,
        disabled,
        created,
        url,
      } = req.body;

      let user = new User();
      user.address = address;
      user.profile = profile ? profile : {};
      user.account = account ? account : {};
      user.onboardType = onboardType;
      user.firstname = firstname;
      user.middlename = middlename;
      user.lastname = lastname;
      user.phoneNumber = phoneNumber;
      user.phoneNumberConfirmed = phoneNumberConfirmed;
      user.phoneNumberConfirmStatus = phoneNumberConfirmStatus;
      user.countryCode = countryCode;
      user.email = email;
      user.emailConfirmed = emailConfirmed;
      user.emailConfirmStatus = emailConfirmStatus;
      user.password = password;
      user.regKey = regKey;
      user.registered = registered;
      user.deviceId = deviceId;
      user.browserId = browserId;
      user.twoFactorEnabled = twoFactorEnabled;
      user.lockoutEndDateUtc = lockoutEndDateUtc;
      user.lockoutEnabled = lockoutEnabled;
      user.accessFailedCount = accessFailedCount;
      user.disabled = disabled;
      user.created = created;

      let isValid: string[] = Validator.isValidUser(user);

      if (isValid.length == 0) {
        let userData = await repo.saveUser(user);

        return res.send(super.response(super._200, userData));
      } else {
        super.response(super._400, null, isValid);
      }
    } catch (error) {
      return res.send(super.response(super._500, null, super.ex(error)));
    }
  }
}

export default UserController;