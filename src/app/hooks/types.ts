import { HexString } from "@gear-js/api";

export type Session = {
  key: HexString;
  expires: string;
  allowedActions: string[];
};
