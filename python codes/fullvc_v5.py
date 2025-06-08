import requests
from bs4 import BeautifulSoup
import time
import openai
import json
import re

# Set your OpenAI API key
openai.api_key = "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"

# Supabase Config
SUPABASE_URL = "https://kbyqlgmkowekcobzakpx.supabase.co/" 
SUPABASE_API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtieXFsZ21rb3dla2NvYnpha3B4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTM1MzA4MSwiZXhwIjoyMDY0OTI5MDgxfQ.dqFXnV2zjc-i7dzoqStc7t_hzQEDBHGA7966JjwFe_M"
TABLE_NAME = "grant_urls"

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
}

def get_grant_urls_from_supabase():
    """
    Fetches URLs from Supabase 'grant_urls' table.
    Returns list of URLs or empty list on failure.
    """
    headers = {
        "apikey": SUPABASE_API_KEY,
        "Authorization": f"Bearer {SUPABASE_API_KEY}"
    }

    try:
        response = requests.get(f"{SUPABASE_URL}/rest/v1/{TABLE_NAME}", headers=headers)
        
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
                "content_snippet": body_text[:2000]  # Limiting to 2000 chars for GPT input
            }
        elif response.status_code == 404:
            print(f"Page not found (404): {url}\n")
        elif response.status_code == 403:
            print(f"Forbidden (403): {url}. Access denied.\n")
        else:
            print(f"Failed to retrieve {url}, Status Code: {response.status_code}\n")
    
    except requests.exceptions.RequestException as e:
        print(f"Error fetching {url}: {e}\n")

    return None

def extract_grant_info_with_gpt(text):
    prompt = (
        "You are a helpful assistant. Extract any information related to grant programmes, "
        "funding opportunities, initiatives, or financial support for businesses or technology. "
        "Return only the relevant parts sorted by this format:\n\n"
        "Target data types: company_name, website_url, industry_sector, description_services, contact_info, social_enterprise_status, related_news_updates, program_participation\n"
        "Separate each funding program clearly even if they're on the same website.Company_name can be taken from the website link and then you compare\n\n"
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
    """Parses GPT's raw text into structured JSON objects per fund."""
    entries = []

    print("\n--- Raw GPT Response ---")
    print(gpt_text)
    print("--- End of GPT Response ---\n")

    # Try to extract main company_name and shared details
    # Take the first non-empty line from the raw GPT response as company name
    first_line = next((line.strip() for line in gpt_text.splitlines() if line.strip()), None)
    company_name_match = None

    if first_line:
        company_name_match = re.match(r'(.+?)(?=\s*[:(]|$)', first_line)  # Extract name before colon or dash

    company_name = (company_name_match.group(1).strip() if company_name_match else first_line) if first_line else ""

    website_url_match = re.search(r'website_url:\s*(\S+)', gpt_text)
    industry_sector_match = re.search(r'industry_sector:\s*(.+)', gpt_text)
    description_match = re.search(r'description_services:\s*(.+?)(?=\n\S|$)', gpt_text, re.DOTALL)

    website_url = website_url_match.group(1).strip() if website_url_match else source_url
    industry_sector = industry_sector_match.group(1).strip() if industry_sector_match else ""
    description = description_match.group(1).strip() if description_match else ""

    contact_info_match = re.search(r'contact_info:\s*(.+?)(?=\n\S|$)', gpt_text, re.DOTALL)
    contact_info = contact_info_match.group(1).strip() if contact_info_match else ""

    # Try to find program_participation section
    program_section = re.search(r'program_participation:(.*?)(?=\n\n|\Z)', gpt_text, re.DOTALL)
    program_text = program_section.group(1).strip() if program_section else ""

    fund_matches = re.findall(r'(?:^-|\d+\.)\s+(.+?)\s*[:-]?\s*(.*?)(?=(?:^-|\d+\.)|\Z)', program_text, re.DOTALL)

    if not fund_matches:
        # Try simpler method if above didn't work
        if program_text:
            fund_list = re.split(r'\n(?:-|\d+\.)\s+', program_text.strip())
            fund_list = [f.strip() for f in fund_list if f.strip()]
            for fund in fund_list:
                entry = {
                    "company_name": company_name or "Not specified",
                    "website_url": website_url or source_url,
                    "industry_sector": industry_sector or "Not specified",
                    "description_services": fund or "Not specified",
                    "fund_name": description or "Not specified",
                    "contact_info": contact_info or "Not specified",
                    "social_enterprise_status": "Not specified",
                    "related_news_updates": "Not specified",
                    "program_participation": "Not specified"
                }
                entries.append(entry)
        else:
            # No fund information at all: create at least one fallback entry
            entry = {
                "company_name": company_name or "Not specified",
                "website_url": website_url or source_url,
                "industry_sector": industry_sector or "Not specified",
                "description_services": description or "Not specified",
                "fund_name": "Not specified",
                "contact_info": contact_info or "Not specified",
                "social_enterprise_status": "Not specified",
                "related_news_updates": "Not specified",
                "program_participation": "Not specified"
            }
            entries.append(entry)
    else:
        for fund_name, fund_desc in fund_matches:
            entry = {
                "company_name": company_name or "Not specified",
                "website_url": website_url or source_url,
                "industry_sector": industry_sector or "Not specified",
                "description_services": description or "Not specified",
                "fund_name": fund_name.strip(),
                "contact_info": contact_info or "Not specified",
                "social_enterprise_status": "Not specified",
                "related_news_updates": "Not specified",
                "program_participation": fund_desc.strip()
            }
            entries.append(entry)

    # Ensure at least one entry is returned even if parsing failed badly
    if not entries:
        print(" Failed to parse any fund entries from GPT response. Creating fallback.")
        entries.append({
            "company_name": "Not specified",
            "website_url": source_url,
            "industry_sector": "Not specified",
            "description_services": "Not specified",
            "fund_name": "Not specified",
            "contact_info": "Not specified",
            "social_enterprise_status": "Not specified",
            "related_news_updates": "Not specified",
            "program_participation": "Not specified"
        })

    return entries
def save_grant_programs_to_supabase(entries):
    """Saves list of grant program entries to Supabase 'grant_programs' table."""
    url = f"{SUPABASE_URL}/rest/v1/grant_programs"
    headers = {
        "apikey": SUPABASE_API_KEY,
        "Authorization": f"Bearer {SUPABASE_API_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal"
    }

    try:
        response = requests.post(url, headers=headers, json=entries)
        if response.status_code in [201, 204]:
            print(f" Successfully inserted {len(entries)} records into 'grant_programs'.")
        else:
            print(f" Failed to insert data into 'grant_programs'. Status Code: {response.status_code}")
            print("Response:", response.text)
    except Exception as e:
        print(f" Error saving to Supabase: {e}")
def main():
    all_grant_data = []

    urls = get_grant_urls_from_supabase()

    if not urls:
        print(" No URLs found in Supabase. Exiting...")
        return

    for url in urls:
        result = scrape_website(url)
        if result:
            print("Filtering content using OpenAI...")
            filtered_content = extract_grant_info_with_gpt(result["content_snippet"])
            if filtered_content:
                parsed_entries = parse_gpt_response(filtered_content, result["url"])
                all_grant_data.extend(parsed_entries)
        time.sleep(2)  # Be respectful with delays

    # Save parsed data to Supabase
    if all_grant_data:
        save_grant_programs_to_supabase(all_grant_data)
    else:
        print(" No grant programs extracted to save.")

if __name__ == "__main__":
    main()