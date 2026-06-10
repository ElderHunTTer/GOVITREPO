import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

function loadEnvFile(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");

  for (const line of raw.split(/\r?\n/)) {
    if (!line || line.trim().startsWith("#") || !line.includes("=")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");
    const key = line.slice(0, separatorIndex);
    const value = line.slice(separatorIndex + 1);
    process.env[key] = value;
  }
}

const envPath = path.join(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  loadEnvFile(envPath);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
const bucketName =
  process.env.SUPABASE_STORAGE_BUCKET_LABELS ?? "label-review-images";

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    "Missing Supabase environment variables. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY."
  );
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

function buildSvgLabel({
  title,
  producer,
  category,
  size,
  badge,
  warningAccent
}) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1200" height="1600" viewBox="0 0 1200 1600" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="1600" rx="48" fill="#F8FBFF"/>
  <rect x="48" y="48" width="1104" height="1504" rx="36" fill="white" stroke="#143E77" stroke-width="8"/>
  <rect x="88" y="88" width="1024" height="84" rx="18" fill="#143E77"/>
  <text x="600" y="143" text-anchor="middle" fill="white" font-family="Georgia, serif" font-size="36" letter-spacing="6">UNITED STATES LABEL REVIEW DEMO</text>
  <rect x="94" y="196" width="280" height="54" rx="27" fill="#C32033" fill-opacity="0.1"/>
  <text x="234" y="231" text-anchor="middle" fill="#C32033" font-family="Arial, sans-serif" font-size="24" font-weight="700">${badge}</text>
  <text x="600" y="420" text-anchor="middle" fill="#143E77" font-family="Georgia, serif" font-size="92" font-weight="700">${title}</text>
  <text x="600" y="492" text-anchor="middle" fill="#5B7396" font-family="Arial, sans-serif" font-size="36" letter-spacing="3">${producer}</text>
  <line x1="180" y1="560" x2="1020" y2="560" stroke="#DEE8F6" stroke-width="4"/>
  <text x="600" y="670" text-anchor="middle" fill="#0F2341" font-family="Arial, sans-serif" font-size="44" font-weight="700">${category}</text>
  <text x="600" y="752" text-anchor="middle" fill="#143E77" font-family="Arial, sans-serif" font-size="58" font-weight="700">${size}</text>
  <rect x="176" y="980" width="848" height="250" rx="28" fill="#F2F7FE" stroke="${warningAccent}" stroke-width="3"/>
  <text x="600" y="1044" text-anchor="middle" fill="${warningAccent}" font-family="Arial, sans-serif" font-size="30" font-weight="700">GOVERNMENT WARNING</text>
  <text x="216" y="1102" fill="#405A7F" font-family="Arial, sans-serif" font-size="26">
    <tspan x="216" dy="0">(1) According to the Surgeon General, women should not drink alcoholic beverages during</tspan>
    <tspan x="216" dy="38">pregnancy because of the risk of birth defects. (2) Consumption of alcoholic beverages</tspan>
    <tspan x="216" dy="38">impairs your ability to drive a car or operate machinery, and may cause health problems.</tspan>
  </text>
  <rect x="176" y="1290" width="848" height="122" rx="18" fill="#143E77"/>
  <text x="600" y="1363" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="36" font-weight="700">TTB Showcase Sample Label</text>
</svg>`;
}

const demoLabels = [
  {
    slug: "liberty-lane-bourbon",
    title: "Liberty Lane",
    producer: "Union River Distilling Co.",
    category: "Straight Bourbon Whiskey",
    summary: "A clean pass example with aligned statement, brand, and net contents.",
    storagePath: "demo/liberty-lane-bourbon.svg",
    submittedFields: {
      brandName: "Liberty Lane",
      classType: "Straight Bourbon Whiskey",
      netContents: "750 mL",
      alcoholByVolume: "45% Alc/Vol",
      governmentWarning:
        "GOVERNMENT WARNING: (1) According to the Surgeon General, women should not drink alcoholic beverages during pregnancy because of the risk of birth defects. (2) Consumption of alcoholic beverages impairs your ability to drive a car or operate machinery, and may cause health problems."
    },
    sampleFieldResults: [
      {
        fieldName: "governmentWarning",
        status: "pass",
        expectedValue:
          "GOVERNMENT WARNING: (1) According to the Surgeon General, women should not drink alcoholic beverages during pregnancy because of the risk of birth defects. (2) Consumption of alcoholic beverages impairs your ability to drive a car or operate machinery, and may cause health problems.",
        detectedValue:
          "GOVERNMENT WARNING: (1) According to the Surgeon General, women should not drink alcoholic beverages during pregnancy because of the risk of birth defects. (2) Consumption of alcoholic beverages impairs your ability to drive a car or operate machinery, and may cause health problems.",
        confidence: 0.99,
        reason: "Detected warning text matches the required statement exactly."
      },
      {
        fieldName: "brandName",
        status: "pass",
        expectedValue: "Liberty Lane",
        detectedValue: "Liberty Lane",
        confidence: 0.98,
        reason: "Brand name matches the submitted application value."
      },
      {
        fieldName: "netContents",
        status: "pass",
        expectedValue: "750 mL",
        detectedValue: "750 mL",
        confidence: 0.97,
        reason: "Structured volume matches the label statement."
      }
    ],
    svg: buildSvgLabel({
      title: "LIBERTY LANE",
      producer: "UNION RIVER DISTILLING CO.",
      category: "STRAIGHT BOURBON WHISKEY",
      size: "750 mL | 45% ALC/VOL",
      badge: "PASS EXEMPLAR",
      warningAccent: "#1D6F57"
    })
  },
  {
    slug: "blue-harbor-gin",
    title: "Blue Harbor",
    producer: "Atlantic Line Spirits",
    category: "Dry Gin",
    summary: "A reviewer-attention example where the branding normalizes cleanly but should still be reviewed.",
    storagePath: "demo/blue-harbor-gin.svg",
    submittedFields: {
      brandName: "BLUE HARBOR",
      classType: "Dry Gin",
      netContents: "750 mL",
      alcoholByVolume: "42% Alc/Vol",
      governmentWarning:
        "GOVERNMENT WARNING: (1) According to the Surgeon General, women should not drink alcoholic beverages during pregnancy because of the risk of birth defects. (2) Consumption of alcoholic beverages impairs your ability to drive a car or operate machinery, and may cause health problems."
    },
    sampleFieldResults: [
      {
        fieldName: "governmentWarning",
        status: "pass",
        expectedValue:
          "GOVERNMENT WARNING: (1) According to the Surgeon General, women should not drink alcoholic beverages during pregnancy because of the risk of birth defects. (2) Consumption of alcoholic beverages impairs your ability to drive a car or operate machinery, and may cause health problems.",
        detectedValue:
          "GOVERNMENT WARNING: (1) According to the Surgeon General, women should not drink alcoholic beverages during pregnancy because of the risk of birth defects. (2) Consumption of alcoholic beverages impairs your ability to drive a car or operate machinery, and may cause health problems.",
        confidence: 0.98,
        reason: "The regulated warning text appears complete and exact."
      },
      {
        fieldName: "brandName",
        status: "review",
        expectedValue: "BLUE HARBOR",
        detectedValue: "Blue Harbor",
        confidence: 0.91,
        reason: "Normalized values align, but the reviewer should confirm label presentation and casing."
      },
      {
        fieldName: "classType",
        status: "pass",
        expectedValue: "Dry Gin",
        detectedValue: "Dry Gin",
        confidence: 0.95,
        reason: "Class and type statement match the submitted application."
      }
    ],
    svg: buildSvgLabel({
      title: "BLUE HARBOR",
      producer: "ATLANTIC LINE SPIRITS",
      category: "DRY GIN",
      size: "750 mL | 42% ALC/VOL",
      badge: "REVIEW EXEMPLAR",
      warningAccent: "#295FA6"
    })
  },
  {
    slug: "red-rock-rye",
    title: "Red Rock Reserve",
    producer: "Federal Range Distillery",
    category: "Rye Whiskey",
    summary: "A fail example showing a structured mismatch in net contents.",
    storagePath: "demo/red-rock-rye.svg",
    submittedFields: {
      brandName: "Red Rock Reserve",
      classType: "Rye Whiskey",
      netContents: "750 mL",
      alcoholByVolume: "50% Alc/Vol",
      governmentWarning:
        "GOVERNMENT WARNING: (1) According to the Surgeon General, women should not drink alcoholic beverages during pregnancy because of the risk of birth defects. (2) Consumption of alcoholic beverages impairs your ability to drive a car or operate machinery, and may cause health problems."
    },
    sampleFieldResults: [
      {
        fieldName: "governmentWarning",
        status: "pass",
        expectedValue:
          "GOVERNMENT WARNING: (1) According to the Surgeon General, women should not drink alcoholic beverages during pregnancy because of the risk of birth defects. (2) Consumption of alcoholic beverages impairs your ability to drive a car or operate machinery, and may cause health problems.",
        detectedValue:
          "GOVERNMENT WARNING: (1) According to the Surgeon General, women should not drink alcoholic beverages during pregnancy because of the risk of birth defects. (2) Consumption of alcoholic beverages impairs your ability to drive a car or operate machinery, and may cause health problems.",
        confidence: 0.98,
        reason: "The warning text matches the required statement."
      },
      {
        fieldName: "netContents",
        status: "fail",
        expectedValue: "750 mL",
        detectedValue: "700 mL",
        confidence: 0.96,
        reason: "Structured quantity on the label does not match the submitted application."
      },
      {
        fieldName: "alcoholByVolume",
        status: "pass",
        expectedValue: "50% Alc/Vol",
        detectedValue: "50% Alc/Vol",
        confidence: 0.94,
        reason: "Alcohol statement matches the submitted application."
      }
    ],
    svg: buildSvgLabel({
      title: "RED ROCK RESERVE",
      producer: "FEDERAL RANGE DISTILLERY",
      category: "RYE WHISKEY",
      size: "700 mL | 50% ALC/VOL",
      badge: "FAIL EXEMPLAR",
      warningAccent: "#B3202E"
    })
  }
];

for (const demoLabel of demoLabels) {
  const { error: uploadError } = await supabase.storage
    .from(bucketName)
    .upload(demoLabel.storagePath, Buffer.from(demoLabel.svg, "utf8"), {
      contentType: "image/svg+xml",
      upsert: true
    });

  if (uploadError) {
    throw uploadError;
  }
}

const rows = demoLabels.map(({ svg, ...demoLabel }) => ({
  slug: demoLabel.slug,
  title: demoLabel.title,
  producer: demoLabel.producer,
  category: demoLabel.category,
  summary: demoLabel.summary,
  storage_path: demoLabel.storagePath,
  submitted_fields: demoLabel.submittedFields,
  sample_field_results: demoLabel.sampleFieldResults
}));
const { error: upsertError } = await supabase
  .from("demo_labels")
  .upsert(rows, { onConflict: "slug" });

if (upsertError) {
  throw upsertError;
}

console.log(`Seeded ${rows.length} demo labels into ${bucketName}.`);
