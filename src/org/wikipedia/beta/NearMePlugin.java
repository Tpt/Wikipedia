package org.wikipedia.beta;

import org.json.JSONArray;
import org.json.JSONException;
import org.wikipedia.beta.R;

import android.content.Intent;
import android.util.Log;

import org.apache.cordova.api.Plugin;
import org.apache.cordova.api.PluginResult;

public class NearMePlugin extends Plugin {

	public static int GET_GEONAME_URL = 0;
	public static int RESULT_OK = 0;
	private String callbackId;

	@Override
	public PluginResult execute(String action, JSONArray args, String callbackId) {
		PluginResult result = null;
		this.callbackId = callbackId;
		String lang = null;
		try {
			lang = args.getString(0);
		} catch (JSONException e1) {
			lang = "en";
		}
		if (action.compareTo("startNearMeActivity") == 0) {
			try {
				Intent intent = new Intent(ctx.getContext(), Class.forName("org.wikipedia.NearMeActivity"));
				intent.putExtra("language", lang);
				ctx.startActivityForResult((Plugin) this, intent, GET_GEONAME_URL);
				result = new PluginResult(PluginResult.Status.NO_RESULT);
				result.setKeepCallback(true);
			} catch (ClassNotFoundException e) {
				result = new PluginResult(PluginResult.Status.CLASS_NOT_FOUND_EXCEPTION);
			}
		}
		return result;
	}

	@Override
	public void onActivityResult(int requestCode, int resultCode, Intent intent) {
		if (requestCode == GET_GEONAME_URL && intent != null) {
			if (resultCode == RESULT_OK) {
				Log.d("NearMePlugin", intent.getExtras().getString("wikipediaUrl"));
				this.success(new PluginResult(PluginResult.Status.OK, intent.getExtras().getString("wikipediaUrl")), callbackId);
			}
		} else {
			this.success(new PluginResult(PluginResult.Status.NO_RESULT), callbackId);
		}
	}

}