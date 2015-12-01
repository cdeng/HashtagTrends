package main;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.net.URL;
import java.util.HashSet;
import java.util.Set;
import java.io.BufferedWriter;
import java.io.FileWriter;

import org.json.simple.JSONArray;
import org.json.simple.JSONObject;
import org.json.simple.parser.JSONParser;
import org.json.simple.parser.ParseException;

/**
 * Fetches the data from Instagram corresponding to a particular tag Parses the
 * json response and then further analyzes it
 */

public class TagFetch {
	public String base_url = "https://api.instagram.com/v1/tags/";
	public String access_token = "2288218756.5b9e1e6.b0da2d05b21f4e879778a5443b4352ce";
	// Remember to add your own access token here
	public String tag = "Zara";
	public String suffix_url = "/media/recent?access_token=";

	/**
	 * public constructor to initialize the access-token
	 * 
	 * @param access_token
	 *            String containing the access-token
	 */

	public TagFetch(String access_token) {
		this.access_token = access_token;
	}

	/**
	 * public constructor to initialize the tag name and the access token
	 * 
	 * @param tag
	 *            String containing the tag name
	 * @param access_token
	 *            String containing the access-token
	 */

	public TagFetch(String tag, String access_token) {
		this.tag = tag;
		this.access_token = access_token;
	}

	/**
	 * public default constructor to initialize the object
	 */

	public TagFetch() {
	}

	/**
	 * Given a tag returns the first page of the JSON response
	 * 
	 * @param tag
	 *            String containing the tag name which is to be searched
	 * @return String containing the JSON response
	 * @throws IOException
	 */

	public String getJSONTag(String tag) throws IOException {
		String url;
		BufferedReader br;
		String temp = "";
		String response = "";

		url = base_url + tag + suffix_url + access_token;
		URL instagram = new URL(url);

		br = new BufferedReader(new InputStreamReader(instagram.openStream()));

		while ((temp = br.readLine()) != null) {
			response = response + temp;
		}

		return response;
	}

	/**
	 * Given a link to the API endpoint returns the JSON response
	 * 
	 * @param link
	 *            String containing the link of the endpoint
	 * @return String containing the response
	 * @throws IOException
	 */

	public String getJSONResponse(String link) throws IOException {
		URL url = new URL(link);
		String temp = "";
		String response = "";
		BufferedReader br;

		br = new BufferedReader(new InputStreamReader(url.openStream()));

		while ((temp = br.readLine()) != null) {

			response = response + temp;
		}

		return response;
	}

	/**
	 * Given a JSON string returns the JSONArray containing the data
	 * 
	 * @param response
	 *            String containing the JSON response
	 * @return JSONArray containing the data field of the JSON response
	 * @throws ParseException
	 */

	public JSONArray getParsedDataArray(String response, String array_field_name)
			throws ParseException {
		JSONParser parser = new JSONParser();
		JSONObject parsed_object = (JSONObject) parser.parse(response);
		JSONArray data_json = (JSONArray) parsed_object.get(array_field_name);

		return data_json;
	}

	/**
	 * Given a JSON response of the tag endpoint API returns the url to the next
	 * page
	 * 
	 * @param response
	 *            String containing the Json response
	 * @return String containing the next URL
	 * @throws ParseException
	 */

	public String getNextURL(String response) throws ParseException {
		String next_url = "";
		JSONParser parser = new JSONParser();
		JSONObject parsed_object = (JSONObject) parser.parse(response);
		JSONObject pagination = (JSONObject) parsed_object.get("pagination");

		next_url = (String) pagination.get("next_url");

		return next_url;
	}

	/**
	 * Returns a Set of tags from a given JSON data array
	 * 
	 * @param data_array
	 *            JSONArray containing the set of data per response
	 * @return Set<String> containing the collection of tags
	 */

	public Set<String> getTagSet(JSONArray data_array) throws IOException {
		Set<String> tag_set = new HashSet<String>();
		JSONObject temp;
		JSONArray tag_array;

		for (int i = 0; i < data_array.size(); i++) {
			temp = (JSONObject) data_array.get(i);
			tag_array = (JSONArray) temp.get("tags");

			for (int j = 0; j < tag_array.size(); j++) {
				tag_set.add((String) tag_array.get(j));
			}
		}

		return tag_set;
	}

	public String printNiceByPost(int pageNum, JSONArray data_array) {
		String result = "";
		JSONObject current;

		for (int i = 0; i < data_array.size(); i++) {
			current = (JSONObject) data_array.get(i);

			// get user name
			JSONObject user = (JSONObject) current.get("user");
			String userName = (String) user.get("username");

			// get location
			JSONObject loc = (JSONObject) current.get("location");
			String locName = "";
			Double locLatitude;
			Double locLongitude;
			if (loc != null) {
				locName = (String) loc.get("name");
				locLongitude = (Double) loc.get("longitude");
				locLatitude = (Double) loc.get("latitude");
			}else {
				continue;
			}

			result += String.format("----Post %d, %d-----\n", pageNum, i + 1);
			result += String.format("username = %s\n", userName);
			result += String.format("location = %s\n", locName);
			result += String.format("longitude = %f\n", locLongitude);
			result += String.format("latitude = %f\n\n", locLatitude);
		}

		return result;
	}

	/**
	 * Returns a Set of caption text from a given JSON data array
	 * 
	 * @param data_array
	 *            JSONArray containing the set of data per response
	 * @return Set<String> containing the collection of caption text
	 */

	public Set<String> getCaptionTimeText(JSONArray data_array) {

		JSONObject temp;
		JSONObject caption_object;
		String created_time = "";
		String text = "";
		Set<String> text_set = new HashSet<String>();

		for (int i = 0; i < data_array.size(); i++) {
			temp = (JSONObject) data_array.get(i);
			caption_object = (JSONObject) temp.get("caption");

			created_time = (String) caption_object.get("created_time");
			text = (String) caption_object.get("text");
			text_set.add(text);
		}

		return text_set;
	}

	/**
	 * Returns a Set of caption text from a given JSON data array
	 * 
	 * @param data_array
	 *            JSONArray containing the set of data per response
	 * @return Set<String> containing the collection of caption text
	 */

	public Set<String> getLocation(JSONArray data_array) {

		JSONObject temp;
		JSONObject location_object;
		String created_time = "";
		String text = "";
		Set<String> locationName_set = new HashSet<String>();

		for (int i = 0; i < data_array.size(); i++) {
			temp = (JSONObject) data_array.get(i);
			location_object = (JSONObject) temp.get("location");

			if (location_object != null) {
				text = (String) location_object.get("name");
				locationName_set.add(text);
			}
		}

		return locationName_set;
	}

	/**
	 * Prints out the results to a file
	 * 
	 * @param Set
	 *            <String> arr being the set to be printed, String type defining
	 *            whether tagset or caption text is being printed
	 * @throws IOException
	 */

	public void commitToFile(Set<String> arr, String type) throws IOException {
		FileWriter fw;
		BufferedWriter bw;

		fw = new FileWriter("file1.txt", true);
		bw = new BufferedWriter(fw);

		if (type == "t") {
			bw.write("\n\nTAG SET\n\n");
		} else if (type == "c") {
			bw.write("\n\nLOCATION TEXT\n\n");
		}

		for (String s : arr) {
			bw.write(s);
			bw.write(" ");
		}

		bw.close();
		fw.close();
	}
	
	public void writeStringToFile(String str) throws IOException {
		FileWriter fw;
		BufferedWriter bw;

		fw = new FileWriter("file1.txt", true);
		bw = new BufferedWriter(fw);
		
		bw.write(str);
		
		bw.close();
		fw.close();
	}

	/**
	 * Defines the tag processing pipeline for a given tag name
	 * 
	 * @param tag_name
	 *            String containing the tag name
	 * @throws IOException
	 * @throws ParseException
	 */

	public void TagPipeline(String tag_name) throws IOException, ParseException {
		String response = getJSONTag(tag_name);
		String next_url = getNextURL(response);
		int page_count = 1;

		FileWriter fw = new FileWriter("file1.txt");
		BufferedWriter bw = new BufferedWriter(fw);

		while (!next_url.isEmpty()) {
			JSONArray data_array = getParsedDataArray(response, "data");

			String temp = printNiceByPost(page_count, data_array);
			System.out.print(temp);
			writeStringToFile(temp);
			
//			System.out
//					.println("==================== Tag set ===================\n");
//			System.out.println(getTagSet(data_array));
//			commitToFile(getTagSet(data_array), "t");
//
//			System.out
//					.println("\n==============================================\n");
//			System.out
//					.println("====================== Location Text ==================\n");
//			System.out.println(getLocation(data_array));
//			commitToFile(getLocation(data_array), "c");
//
//			System.out
//					.println("\n======================================================\n");
			
			response = getJSONResponse(next_url);
			next_url = getNextURL(response);

//			System.out.println("=================== Page Count " + page_count + "====================");
			page_count++;
//			System.out.println("=================== Next URL : " + next_url + "===================");
//			System.out.println();

			if (page_count > 100) {
				break;
			}
		}

		bw.close();
		fw.close();
	}

	/**
	 * Main function to test the functionality of the class
	 * 
	 * @param args
	 * @throws IOException
	 * @throws ParseException
	 */

	public static void main(String args[]) throws IOException, ParseException {
		TagFetch tags = new TagFetch();
		tags.TagPipeline("Zara");
	}
}