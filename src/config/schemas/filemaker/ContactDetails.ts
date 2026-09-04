/**
 * Put your custom overrides or transformations here.
 * Changes to this file will NOT be overwritten.
 */
import { z } from "zod/v4";
import {
  ZAddresses as ZAddresses_generated,
  ZEmailAddresses as ZEmailAddresses_generated,
  ZPhoneNumbers as ZPhoneNumbers_generated,
  ZVLCompany as ZVLCompany_generated,
  ZVLPhoneType as ZVLPhoneType_generated,
  ZVLEmailType as ZVLEmailType_generated,
  ZVLAddressType as ZVLAddressType_generated,
  ZVLTitle as ZVLTitle_generated,
  ZContactDetails as ZContactDetails_generated,
} from "./generated/ContactDetails";
import type { InferZodPortals } from "@proofkit/fmdapi";

export const ZAddresses = ZAddresses_generated;

export type TAddresses = z.infer<typeof ZAddresses>;

export const ZEmailAddresses = ZEmailAddresses_generated;

export type TEmailAddresses = z.infer<typeof ZEmailAddresses>;

export const ZPhoneNumbers = ZPhoneNumbers_generated;

export type TPhoneNumbers = z.infer<typeof ZPhoneNumbers>;

export const ZVLCompany = ZVLCompany_generated;

export type TVLCompany = z.infer<typeof ZVLCompany>;

export const ZVLPhoneType = ZVLPhoneType_generated;

export type TVLPhoneType = z.infer<typeof ZVLPhoneType>;

export const ZVLEmailType = ZVLEmailType_generated;

export type TVLEmailType = z.infer<typeof ZVLEmailType>;

export const ZVLAddressType = ZVLAddressType_generated;

export type TVLAddressType = z.infer<typeof ZVLAddressType>;

export const ZVLTitle = ZVLTitle_generated;

export type TVLTitle = z.infer<typeof ZVLTitle>;

export const ZContactDetails = ZContactDetails_generated;

export type TContactDetails = z.infer<typeof ZContactDetails>;

export const ZContactDetailsPortals = {
  Addresses: ZAddresses,
  "Email Addresses": ZEmailAddresses,
  "Phone Numbers": ZPhoneNumbers,
};

export type TContactDetailsPortals = InferZodPortals<
  typeof ZContactDetailsPortals
>;
