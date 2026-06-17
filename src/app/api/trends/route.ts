import { NextResponse } from "next/server";

export async function GET() {
  try {
    const res = await fetch(
      'https://api.usaspending.gov/api/v2/references/total_budgetary_resources/'
    );

    if (!res.ok) {
      return NextResponse.json({ error: "Failed to fetch trends" }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}