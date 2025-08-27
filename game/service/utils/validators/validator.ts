import { Game } from "../../models/game.entity";

class Validator {
  /**
   * Errors Container
   */
  protected static errors: any = [];

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

  public static isValidGame(game: Game): [] {
    try {
      this.errors = [];

      if(this.isEmpty(game.gameTitle)) this.errors.push("The field 'gameTitle' is required");
      if(this.isEmpty(game.entryFee)) this.errors.push("The field 'entryFee' is required");

      return this.errors;
    } catch (error) {
      return [];
    }
  }
}

export default Validator;
