import { NextResponse } from "next/server";

export async function GET() {
  try {
    const response = await fetch(
      'https://api.usaspending.gov/api/v2/references/agency/index/?sort_by=budgetary_resources&order=desc&limit=100',
      { next: { revalidate: 3600 } }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("USASpending API error:", errorText.slice(0, 300));
      return NextResponse.json({ error: "Government server error" }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}