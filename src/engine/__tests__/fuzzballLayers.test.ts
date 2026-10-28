import { describe, expect, it } from "vitest";
import { FUZZBALL_DEFS, FUZZBALL_ITEM_ART } from "../../components/common/fuzzballLayers.ts";

describe("the generated layers of the fuzzball", () => {
  it("marks the reds of the items, also in the gradients they use, as accent placeholders", () => {
    expect(FUZZBALL_ITEM_ART["gekleurde-bril"]).toContain("{{accent|181,23,0}}");
    expect(FUZZBALL_ITEM_ART.strik).toContain("{{accent|");
    expect(FUZZBALL_ITEM_ART.koptelefoon).toContain("{{accent|207,27,1}}");
    expect(FUZZBALL_ITEM_ART.bril).not.toContain("{{accent|");
    // The lenses of the coloured glasses are gradients in the shared defs.
    expect(FUZZBALL_DEFS).toContain("{{accent|255,96,75}}");
    expect(FUZZBALL_DEFS).toContain("{{accent|181,21,0}}");
    // The fur gradients keep their roles.
    expect(FUZZBALL_DEFS).toContain("{{limb}}");
  });
});
