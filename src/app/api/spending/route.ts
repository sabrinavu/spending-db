import { NextResponse } from "next/server";

export async function GET() {
  try {
    const res = await fetch(
      'https://api.usaspending.gov/api/v2/references/toptier_agencies/',
      { next: { revalidate: 3600 } }
    );

    if (!res.ok) {
      const text = await res.text();
      console.error("USASpending error:", text.slice(0, 300));
      return NextResponse.json({ error: "Government server error" }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}