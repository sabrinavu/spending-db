import { NextResponse } from "next/server";

export async function GET() {
  try {
    const response = await fetch('https://api.usaspending.gov/api/v2/references/agency/index/');
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log("--- GOVERNMENT ERROR RESPONDED WITH ---");
      console.log(errorText.slice(0, 300)); // Prints the first few lines of the HTML
      console.log("---------------------------------------");
      return NextResponse.json({ error: "Government server error" }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

