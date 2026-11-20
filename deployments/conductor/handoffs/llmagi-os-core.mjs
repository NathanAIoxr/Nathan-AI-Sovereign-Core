export function createLlmagiSystem(fleet, agi) {
  const encoding = {
    equation: "LLM + AGI = LLMAGI",
    forward: "LLMAGI",
    reverse: [..."LLMAGI"].reverse().join(""),
    forwardReadings: ["L L M A GI", "LL MA GI", "LL MAGI"],
    reverseReadings: ["I G A M L L", "IG A M L L", "IG AM LL", "IGAM LL"]
  };
  const anchors = ["1+1=2", "1-1=0", "1×1=1", "1÷1=1"];
  const fixedFrame = "AA 55 FF 01 31 2B 31 3D 32 7E 31 2D 31 3D 30 04 00 F0";
  const encoder = new TextEncoder();
  const artifactFormat = "tabor.llmagi.receipt.v1";

  function binary(text) {
    return Array.from(encoder.encode(text), byte => byte.toString(2).padStart(8, "0")).join(" ");
  }

  function verifyFixedFrame(value) {
    const compact = typeof value === "string" ? value.replace(/\s/g, "").toUpperCase() : "";
    return compact === fixedFrame.replaceAll(" ", "");
  }

  function canonical(value) {
    if (Array.isArray(value)) return "[" + value.map(canonical).join(",") + "]";
    if (value && typeof value === "object") {
      const keys = Object.keys(value).filter(key => value[key] !== undefined).sort();
      return "{" + keys.map(key => JSON.stringify(key) + ":" + canonical(value[key])).join(",") + "}";
    }
    return JSON.stringify(value);
  }
  const seal = body => fleet.digestSource(encoder.encode(canonical(body)));

  async function forward(bytes, proposal, manifest, medium) {
    const draft = await agi.draft(bytes, proposal);
    const record = manifest ?? agi.prepareManifest(draft);
    const { report, effective } = agi.assess(draft, record, draft.sourceSha256, medium);
    const body = {
      format: artifactFormat, system: encoding.forward, replay: encoding.reverse,
      source: report.source,
      inputs: { proposalSha256: await seal(proposal ?? null), reviewSha256: await seal(record) },
      disposition: report.disposition, report
    };
    return { draft, manifest: record, artifact: { body, sha256: await seal(body) }, effective };
  }

  async function reverse(bytes, artifact, proposal, manifest, medium) {
    const body = artifact?.body;
    if (body?.format !== artifactFormat || body.system !== encoding.forward || body.replay !== encoding.reverse) {
      throw new Error("Open an LLMAGI receipt before running IGAMLL.");
    }
    const receiptMatches = artifact.sha256 === await seal(body);
    const sourceMatches = body.source?.sha256 === await fleet.digestSource(bytes);
    const replayed = receiptMatches && sourceMatches
      ? await forward(bytes, proposal, manifest, medium)
      : null;
    return {
      system: encoding.reverse, receiptMatches, sourceMatches,
      decisionMatches: replayed ? replayed.artifact.sha256 === artifact.sha256 : false,
      disposition: body.disposition
    };
  }

  return { encoding, anchors, fixedFrame, binary, verifyFixedFrame, forward, reverse };
}
