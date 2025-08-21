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
}

export default Validator;
