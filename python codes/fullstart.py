import requests
from bs4 import BeautifulSoup
import time
import openai

# Set your OpenAI API key
openai.api_key = ""

# Supabase Config
SUPABASE_URL = "https://kbyqlgmkowekcobzakpx.supabase.co/" 
SUPABASE_API_KEY = ""
STARTUP_URLS_TABLE = "startup_urls"
STARTUPS_TABLE = "startup"
headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
}

# Exact table headers — DO NOT CHANGE
TABLE_HEADERS = [
    "No",
    "CompanyName",
    "WhatTheyDo",
    "Location",
    "Impact",
    "ProblemTheySolve",
    "Grants",
    "InstitutionalSupport",
    "MaGICAccredited",
    "Sector",
    "WebsiteSocialMedia",
    "TargetBeneficiaries",
    "RevenueModel",
    "YearFounded",
    "Awards"
]

# Map snake_case keys for Supabase columns
COLUMN_MAP = {
    "No": "No",
    "CompanyName": "CompanyName",
    "WhatTheyDo": "WhatTheyDo",
    "Location": "Location",
    "Impact": "Impact",
    "ProblemTheySolve": "ProblemTheySolve",
    "Grants": "Grants",
    "InstitutionalSupport": "InstitutionalSupport",
    "MaGICAccredited": "MaGICAccredited",
    "Sector": "Sector",
    "WebsiteSocialMedia": "WebsiteSocialMedia",
    "TargetBeneficiaries": "TargetBeneficiaries",
    "RevenueModel": "RevenueModel",
    "YearFounded": "YearFounded",
    "Awards": "Awards"
}

def get_latest_startup_No():
    url = f"{SUPABASE_URL}/rest/v1/{STARTUPS_TABLE}?select=No&order=No.desc&limit=1"
    auth_headers = {
        "apikey": SUPABASE_API_KEY,
        "Authorization": f"Bearer {SUPABASE_API_KEY}"
    }
    try:
        response = requests.get(url, headers=auth_headers)
        if response.status_code == 200:
            data = response.json()
            if data:
                return data[0]['No'] + 1  # Return next available No
            else:
                return 1  # First entry
        else:
            print(f" Failed to fetch latest No. Status Code: {response.status_code}")
            return 1
    except Exception as e:
        print(f" Error fetching latest No: {e}")
        return 1


def get_grant_urls_from_supabase():
    headers_auth = {
        "apikey": SUPABASE_API_KEY,
        "Authorization": f"Bearer {SUPABASE_API_KEY}"
    }
    try:
        response = requests.get(f"{SUPABASE_URL}/rest/v1/{STARTUP_URLS_TABLE}", headers=headers_auth)
        if response.status_code == 200:
            data = response.json()
            urls = [row["url"] for row in data if row.get("url", "").startswith("http")]
            print(f"\n Retrieved {len(urls)} URLs from Supabase.")
            return urls
        else:
            print(f" Failed to fetch URLs from Supabase. Status Code: {response.status_code}")
            print(response.text)
            return []
    except Exception as e:
        print(f" Error fetching URLs from Supabase: {e}")
        return []


def scrape_website(url):
    try:
        print(f"Scraping {url}...")
        response = requests.get(url, headers=headers, timeout=10)
        if response.status_code == 200:
            soup = BeautifulSoup(response.text, 'html.parser')
            title = soup.title.string.strip() if soup.title else "No Title"
            body_text = soup.get_text()
            print(f"Title of the page: {title}")
            print(f"Length of body text: {len(body_text)} characters\n")
            return {
                "url": url,
                "title": title,
                "content_snippet": body_text[:2000]
            }
        elif response.status_code == 404:
            print(f"Page not found (404): {url}\n")
        elif response.status_code == 403:
            print(f"ForbNoden (403): {url}. Access denied.\n")
        else:
            print(f"Failed to retrieve {url}, Status Code: {response.status_code}\n")
    except requests.exceptions.RequestException as e:
        print(f"Error fetching {url}: {e}\n")
    return None


def extract_startup_info_with_gpt(text):
    prompt = (
        "You are a helpful assistant. Extract any information related to startups, companies, "
        "entrepreneurial ventures, or business profiles. Return only the relevant parts sorted by this format:\n"
        "Target data types: " + ", ".join(TABLE_HEADERS) + "\n"
        "Separate each startup clearly even if they're on the same website.\n"
        "Format example:\n"
        "**CompanyName:** XYZ Tech\n"
        "**WhatTheyDo:** Creates AI-powered tools for education\n"
        "**Location:** Singapore\n"
        "**Impact:** Improved learning outcomes for 100,000 students\n"
        "**ProblemTheySolve:** Lack of personalized learning\n"
        "**Grants:** Yes, $500,000 from ABC Foundation\n"
        "**InstitutionalSupport:** Supported by NUS Enterprise\n"
        "**MaGICAccredited:** Yes\n"
        "**Sector:** Education Technology\n"
        "**WebsiteSocialMedia:** https://xyztech.com\n" 
        "**TargetBeneficiaries:** Students and teachers\n"
        "**RevenueModel:** Subscription-based SaaS\n"
        "**YearFounded:** 2020\n"
        "**Awards:** Winner of Startup Asia 2022\n"
        "---\n"
        f"{text}"
    )
    try:
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=1500,
            temperature=0.3
        )
        return response['choices'][0]['message']['content'].strip()
    except Exception as e:
        print(f"OpenAI API error: {e}")
        return None


def parse_gpt_response(gpt_text, source_url):
    print("\n--- Raw GPT Response ---")
    print(gpt_text)
    print("--- End of GPT Response ---\n")
    entries = []
    startups_raw = gpt_text.strip().split("---")  # Split by separator line
    for block in startups_raw:
        entry = {}
        lines = block.strip().split('\n')
        for line in lines:
            line = line.strip()
            for field in TABLE_HEADERS:
                if line.startswith(f"**{field}:") or line.startswith(f"{field}:"):
                    value = line.split(":", 1)[1].strip()
                    entry[field] = value
                    break
        if "CompanyName" in entry:
            entries.append(entry)
    if not entries:
        print(" No startup data found in GPT response.")
    else:
        print(f" Successfully parsed {len(entries)} startup(s).")
    return entries


def save_startup_entry_to_supabase(entry_data, entry_No):
    insert_url = f"{SUPABASE_URL}/rest/v1/{STARTUPS_TABLE}"
    auth_headers = {
        "apikey": SUPABASE_API_KEY,
        "Authorization": f"Bearer {SUPABASE_API_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal"
    }
    entry_data["No"] = entry_No  # Add the generated No to the entry
    try:
        response = requests.post(insert_url, headers=auth_headers, json=entry_data)
        if response.status_code in (201, 204):
            print(f" Inserted into DB: {entry_data.get('CompanyName', 'No name')}")
        else:
            print(f" Failed to insert '{entry_data.get('CompanyName', 'No name')}', Status: {response.status_code}, Error: {response.text}")
    except Exception as e:
        print(f" Error inserting '{entry_data.get('CompanyName', 'No name')}': {e}")


def main():
    urls = get_grant_urls_from_supabase()
    if not urls:
        print(" No URLs found in Supabase. Exiting...")
        return

    for url in urls:
        result = scrape_website(url)
        if not result:
            no_data_entry = {
                "CompanyName": "No data",
                "WhatTheyDo": "Website could not be scraped or returned no content.",
                "Location": "",
                "Impact": "",
                "ProblemTheySolve": "",
                "Grants": "",
                "InstitutionalSupport": "",
                "MaGICAccredited": "",
                "Sector": "",
                "WebsiteSocialMedia": url,
                "TargetBeneficiaries": "",
                "RevenueModel": "",
                "YearFounded": "2025",
                "Awards": ""
            }
            current_No = get_latest_startup_No()
            save_startup_entry_to_supabase(no_data_entry, current_No)
            continue

        print("Filtering content using OpenAI...")
        filtered_content = extract_startup_info_with_gpt(result["content_snippet"])
        if filtered_content:
            parsed_entries = parse_gpt_response(filtered_content, result["url"])
            if parsed_entries:
                for entry in parsed_entries:
                    mapped_entry = {}
                    for field in TABLE_HEADERS:
                        col_name = COLUMN_MAP[field]
                        value = entry.get(field, "Not defined")
                        if field == "YearFounded":
                            if value.isdigit():
                                mapped_entry[col_name] = int(value)
                            else:
                                mapped_entry[col_name] = None
                        else:
                            mapped_entry[col_name] = value
                    current_No = get_latest_startup_No()
                    save_startup_entry_to_supabase(mapped_entry, current_No)
            else:
                no_data_entry = {
                    "CompanyName": "No data",
                    "WhatTheyDo": "No startup information extracted by GPT.",
                    "Location": "",
                    "Impact": "",
                    "ProblemTheySolve": "",
                    "Grants": "",
                    "InstitutionalSupport": "",
                    "MaGICAccredited": "",
                    "Sector": "",
                    "WebsiteSocialMedia": url,
                    "TargetBeneficiaries": "",
                    "RevenueModel": "",
                    "YearFounded": "2025",
                    "Awards": ""
                }
                current_No = get_latest_startup_No()
                save_startup_entry_to_supabase(no_data_entry, current_No)
        else:
            no_data_entry = {
                "CompanyName": "No data",
                "WhatTheyDo": "Empty response from GPT model.",
                "Location": "",
                "Impact": "",
                "ProblemTheySolve": "",
                "Grants": "",
                "InstitutionalSupport": "",
                "MaGICAccredited": "",
                "Sector": "",
                "WebsiteSocialMedia": url,
                "TargetBeneficiaries": "",
                "RevenueModel": "",
                "YearFounded": "2025",
                "Awards": ""
            }
            current_No = get_latest_startup_No()
            save_startup_entry_to_supabase(no_data_entry, current_No)
        time.sleep(2)

    print("\n Finished processing all URLs.")


if __name__ == "__main__":
    main()
