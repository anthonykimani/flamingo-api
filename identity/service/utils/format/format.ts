import { v4 as uuidv4 } from "uuid";
import { DateTime } from "luxon";

/**
 * Format utils
 */
export class Format {
  /**
   * Get Current Timestamp
   */
  public static getCurrentTimestamp() {
    return DateTime.local().toMillis();
  }
}
