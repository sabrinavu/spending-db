// import { NextResponse } from "next/server";

// export async function GET(
//   request: Request,
//   { params }: { params: { code: string } }
// ) {
//   try {
//     const [budgetRes, awardsRes] = await Promise.all([
//       fetch(`https://api.usaspending.gov/api/v2/agency/${params.code}/budgetary_resources/`),
//       fetch(`https://api.usaspending.gov/api/v2/agency/${params.code}/awards/`)
//     ]);

//     const budget = budgetRes.ok ? await budgetRes.json() : null;
//     const awards = awardsRes.ok ? await awardsRes.json() : null;

//     return NextResponse.json({ budget, awards });
//   } catch (err: any) {
//     return NextResponse.json({ error: err.message }, { status: 500 });
//   }
// }

import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    console.log('Fetching agency code:', code);

    const budgetRes = await fetch(
      `https://api.usaspending.gov/api/v2/agency/${code}/budgetary_resources/`
    );
    const awardsRes = await fetch(
      `https://api.usaspending.gov/api/v2/agency/${code}/awards/`
    );

    console.log('budget status:', budgetRes.status);
    console.log('awards status:', awardsRes.status);

    if (!budgetRes.ok) {
      const text = await budgetRes.text();
      console.log('budget error:', text.slice(0, 200));
    }

    const budget = budgetRes.ok ? await budgetRes.json() : null;
    const awards = awardsRes.ok ? await awardsRes.json() : null;

    return NextResponse.json({ budget, awards });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}