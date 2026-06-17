import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const res = await fetch('https://api.usaspending.gov/api/v2/search/spending_by_award/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filters: {
          time_period: [{ start_date: "2024-01-01", end_date: "2024-12-31" }],
          award_type_codes: body.types || ["A", "B", "C", "D"],
        },
        fields: [
          "Award ID", "Recipient Name", "Award Amount",
          "Awarding Agency", "Award Type", "Start Date",
          "End Date", "Description"
        ],
        page: body.page || 1,
        limit: 25,
        sort: "Award Amount",
        order: "desc",
      }),
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Failed to fetch awards" }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}