import { BaseEntity, Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";
import { IAddress, IProfile } from "../interfaces/IProfile";
import { OnboardType } from "../enums/OnboardType";

@Entity("users")
export class User extends BaseEntity {
    @PrimaryGeneratedColumn("uuid")
    id:string;
    @Column({ length: 256 })
    @Index({ unique: true })
    address: string;
    @Column("simple-json", { nullable: false })
    profile: IProfile;
    @Column("simple-json", { nullable: false })
    account: IAddress;
    @Column({ length: 50, nullable: false })
    onboardType: OnboardType;
    @Column({ length: 100, nullable: true })
    fullname: string;
    @Column({ length: 100, nullable: false })
    firstname: string;
    @Column({ length: 100, nullable: true })
    middlename: string;
    @Column({ length: 100, nullable: false })
    lastname: string;
    @Column({ length: 20, nullable: true })
    phoneNumber: string;
    @Column({ default: false })
    phoneNumberConfirmed: boolean;
    @Column({ length: 50, nullable: true })
    phoneNumberConfirmStatus: string;
    @Column({ length: 10, nullable: true })
    countryCode: string;
    @Column({ length: 256, nullable: true })
    @Index({ unique: true })
    email: string;
    @Column({ default: false })
    emailConfirmed: boolean;
    @Column({ length: 50, nullable: true })
    emailConfirmStatus: string;
    @Column({ length: 100, nullable: false })
    @Index({ unique: true })
    username: string;
    @Column({ type: "text" })
    password: string;
    @Column({ length: 512, nullable: true })
    regKey: string;
    @Column({ default: false })
    twoFactorEnabled: boolean;
    @Column({ default: false })
    registered: boolean;
    @Column({ type: "timestamp" })
    created: Date;
    @Column({ type: "timestamp" })
    lastUpdated: Date;
    @Column({ length: 50, nullable: true })
    updateType: string;
    @Column({ length: 100, nullable: true })
    uuid: string;
    @Column({ type: "text", nullable: true })
    deviceId: string;
    @Column({ type: "text", nullable: true })
    browserId: string;
    @Column({ type: "text", nullable: true })
    accessToken: string;
    @Column({ default: false })
    disabled: boolean;
    @Column({ length: 100, nullable: true })
    disableReason: string;
    @Column({ type: "timestamp", nullable: true })
    lastDisabled: Date;
    @Column({ type: "integer" })
    accessFailedCount: number;
    @Column({ type: "timestamp", nullable: true })
    lockoutEndDateUtc: Date;
    @Column({ default: false })
    lockoutEnabled: boolean;
    @Column({ default: false })
    deleted: boolean;
    @Column({ length: 100, nullable: true })
    deleteReason: string;
    @Column({ type: "timestamp", nullable: true })
    deleteDate: Date;
}