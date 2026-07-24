import { expect } from "chai";
import { GameRepository } from "../repositories/game.repo";

describe("GameRepository (production statics)", () => {
  describe("Game PIN Generation", () => {
    it("should generate a 6-digit PIN", () => {
      const pin = GameRepository.generateGamePin();
      expect(pin).to.have.length(6);
      expect(pin).to.match(/^\d{6}$/);
    });

    it("should generate unique PINs on successive calls", () => {
      const pins = new Set<string>();
      for (let i = 0; i < 100; i++) {
        pins.add(GameRepository.generateGamePin());
      }
      expect(pins.size).to.be.at.least(99);
    });

    it("should generate PINs in the range 100000-999999", () => {
      for (let i = 0; i < 100; i++) {
        const pin = parseInt(GameRepository.generateGamePin(), 10);
        expect(pin).to.be.within(100000, 999999);
      }
    });
  });

  describe("Transaction Hash Validation", () => {
    it("should accept valid tx hash", () => {
      const validHash = "0x" + "a".repeat(64);
      expect(GameRepository.isValidTxHash(validHash)).to.be.true;
    });

    it("should reject hash without 0x prefix", () => {
      expect(GameRepository.isValidTxHash("abcdef1234567890")).to.be.false;
    });

    it("should reject hash with wrong length", () => {
      expect(GameRepository.isValidTxHash("0xabc")).to.be.false;
    });

    it("should reject hash with non-hex characters", () => {
      const invalidHash = "0x" + "z".repeat(64);
      expect(GameRepository.isValidTxHash(invalidHash)).to.be.false;
    });

    it("should accept mixed-case hex hash", () => {
      const mixedHash = "0x" + "AbCdEf0123456789".repeat(4);
      expect(GameRepository.isValidTxHash(mixedHash)).to.be.true;
    });

    it("should reject empty and malformed values", () => {
      expect(GameRepository.isValidTxHash("")).to.be.false;
      expect(GameRepository.isValidTxHash("0x")).to.be.false;
    });
  });
});
