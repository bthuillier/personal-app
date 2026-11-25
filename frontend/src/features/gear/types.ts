import { ampTypeValues, type components } from "@/api/schema";

type Schemas = components["schemas"];

export type Guitar = Schemas["Guitar"];
export type GuitarEvent = Schemas["GuitarEvent"];
export type GuitarTuning = Schemas["GuitarTuning"];
export type GuitarMaterial = Schemas["GuitarMaterial"];
export type Pickup = Schemas["Pickup"];
export type Note = Schemas["Note"];
export type NoteName = Schemas["NoteName"];
export type StringSpec = Schemas["StringSpec"];
export type StringRecommendation = Schemas["StringRecommendation"];
export type StringRecommendationRequest = Schemas["StringRecommendationRequest"];
export type ChangeStrings = Schemas["ChangeStrings"];
export type Amplifier = Schemas["Amplifier"];
export type AmpType = Schemas["AmpType"];
export type GuitarPedal = Schemas["GuitarPedal"];
export type PedalType = Schemas["PedalType"];

/** Every amplifier type, generated from the API schema. */
export const ampTypes = ampTypeValues;

/** A string recommendation the user chose to apply to the change-strings form. */
export interface AppliedRecommendation {
  brand: string;
  gauges: number[];
  tuning: GuitarTuning;
}
