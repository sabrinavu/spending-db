import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: { code: string } }
) {
  try {
    const [budgetRes, awardsRes] = await Promise.all([
      fetch(`https://api.usaspending.gov/api/v2/agency/${params.code}/budgetary_resources/`),
      fetch(`https://api.usaspending.gov/api/v2/agency/${params.code}/awards/`)
    ]);

    const budget = budgetRes.ok ? await budgetRes.json() : null;
    const awards = awardsRes.ok ? await awardsRes.json() : null;

    return NextResponse.json({ budget, awards });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}