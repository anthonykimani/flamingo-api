import { Repository } from "typeorm";
import { User } from "../models/user.entity";
import AppDataSource from "../configs/ormconfig";
import Jwt from "jsonwebtoken";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import { RegistrationStatus } from "../enums/RegistrationStatus";
import { Format } from "../utils/format/format";
import { UserRole } from "../enums/UserRole";

export class UserRepository {
  private repo: Repository<User>;
  private defaultCountryCode = process.env.DEFAULT_COUNTRY_CODE!;
  /**
   * Get environmental variables
   */
  protected config = {
    secret: String(process.env.TOKEN_SECRET),
    issuer: String(process.env.TOKEN_ISSUER),
    expiry: Number(String(process.env.TOKEN_EXPIRY)),
    saltRounds: Number(String(process.env.SALT_ROUNDS)),
  };

  constructor() {
    this.repo = AppDataSource.getRepository(User);
    dotenv.config({ path: `.env.${process.env.NODE_ENV}` });
  }

  /**
   * Save a user
   * @param user User data
   * @returns User
   */
  async saveUser(user: User): Promise<User | undefined> {
    try {
      if (!user.id) {
        //add new user
        user.created = new Date();
        user.lastUpdated = new Date();
        user.phoneNumberConfirmed = false;
        user.phoneNumberConfirmStatus = RegistrationStatus.INITIATED;
        user.countryCode = this.defaultCountryCode;
        user.emailConfirmed = false;
        user.role = UserRole.PLAYER;
        user.username = user.username;

        user.regKey = Jwt.sign({ id: user.email }, this.config.secret);
        user.registered = false;
        user.twoFactorEnabled = false;
        //user.lockoutEndDateUtc = new Date();
        user.lockoutEnabled = false;
        user.accessFailedCount = 0;
        user.disabled = false;
        user.updateType = "NEW_ACCOUNT";
        user.deleted = false;
        //address object
        user.account = user.account || {};
        user.account.address = user.address;

        //profile object
        user.profile = user.profile || {};
        user.profile.shareAnalytics = true;
        user.profile.viewAddressInfo = false;
        if (
          user.profile &&
          (!user.profile.paymentMethod ||
            user.profile.paymentMethod.length === 0)
        ) {
          user.profile.paymentMethod = [];
        }
        user.profile.notifications = user.profile.notifications
          ? user.profile.notifications
          : [];
        user.profile.imgPath = "";
      }

      // Always store passwords hashed — on every save path, not just creation.
      // A value already bcrypt-hashed is left untouched so updates that
      // round-trip the stored hash don't double-hash it.
      if (user.password && !this.isBcryptHash(user.password)) {
        user.password = await this.hashPassword(user.password, this.config.saltRounds);
      } else if (!user.password) {
        user.password = await this.hashPassword(
          Format.getCurrentTimestamp() + "",
          this.config.saltRounds
        );
      }

      user.email = user.email.toLowerCase();

      let userData = await this.repo.save(user);

      return userData;
    } catch (error: any) {
      if (error instanceof Error) {
        throw error;
      } else {
        throw error;
      }
    }
  }

  /**
   * Get All Users
   * @param user User filter params
   * @returns User List
   */
  async getAll(
    user?: User,
    skip?: number,
    take?: number
  ) {
    try {
      let userData: User[] = [];

      // AND semantics: every supplied filter must match. (An array `where`
      // would OR the conditions and leak the full user table.)
      const where: Record<string, any> = { deleted: false };
      if (user) {
        if (user.id) where.id = user.id;
        if (user.email) where.email = user.email;
        if (user.firstname) where.firstname = user.firstname;
        if (user.lastname) where.lastname = user.lastname;
        if (user.address) where.address = user.address;
      }

      userData = await this.repo.find({
        where,
        order: {
          created: "DESC",
        },
      });

      return userData;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      } else {
        throw error;
      }
    }
  }

  /**
   * Get a User by Id
   * @param id
   * @returns User
   */
  async getUserById(id: string): Promise<User | null> {
    try {
      if (!id) return null;

      let userData = await this.repo.find({
        where: [{ id: id }],
        take: 1,
      });
      return userData && userData.length > 0 ? userData[0] : null;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      } else {
        throw error;
      }
    }
  }

  /**
   * Get a User by wallet address
   * @param address Wallet address
   * @returns User | null
   */
  async getUserByAddress(address: string): Promise<User | null> {
    try {
      if (!address) return null;

      let userData = await this.repo.find({
        where: { address },
        take: 1,
      });
      return userData && userData.length > 0 ? userData[0] : null;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      } else {
        throw error;
      }
    }
  }

  /**
   * Hash password
   * @param password plain text password
   * @param saltRounds Ecryption levels
   * @returns string
   */
  async hashPassword(password: string, saltRounds?: number): Promise<string> {
    try {
      saltRounds = saltRounds ? saltRounds : this.config.saltRounds;
      const salt = await bcrypt.genSalt(saltRounds);

      return await bcrypt.hash(password, salt);
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      } else {
        throw error;
      }
    }
  }

  /**
   * Compare a plain-text password against a stored bcrypt hash
   * @param password plain text password
   * @param hash stored bcrypt hash
   * @returns boolean
   */
  async comparePassword(password: string, hash: string): Promise<boolean> {
    if (!password || !hash || !this.isBcryptHash(hash)) return false;
    return bcrypt.compare(password, hash);
  }

  private isBcryptHash(value: string): boolean {
    return /^\$2[aby]\$\d{2}\$/.test(value);
  }
}
