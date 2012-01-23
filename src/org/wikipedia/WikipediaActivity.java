package org.wikipedia;

import android.content.SharedPreferences;
import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.content.Intent;
//import android.util.Log;
//import android.webkit.WebView;

import com.phonegap.DroidGap;

public class WikipediaActivity extends DroidGap {
    /** Called when the activity is first created. */
	
	public class WikipediaWebViewClient extends GapViewClient {
		public WikipediaWebViewClient(DroidGap ctx) {
			super(ctx);
		}
		
		//@Override
		//public void onLoadResource(WebView view, String url) {
		//	Log.d("WikipediaWebViewClient", "OnLoadResource "+url);
		//}
		
	}
	
    @Override
    public void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);
        
        // NearBy shit
		SharedPreferences preferences = getSharedPreferences("nearby", MODE_PRIVATE);
		SharedPreferences.Editor editor = preferences.edit();
		editor.remove("doSearchNearBy");
		editor.commit();
		
		//open directly wikipedia url in the app
		Intent intent = this.getIntent();
		String url = "";
		if (Intent.ACTION_VIEW.equals(intent.getAction())) {
				url = intent.getData().toString();
		}
		super.loadUrl("file:///android_asset/www/index.html?href=" + url);
		this.webViewClient = new WikipediaWebViewClient(this);
		this.appView.setWebViewClient(this.webViewClient);
    }

    @Override
    protected void onNewIntent(Intent intent) {
		if (Intent.ACTION_VIEW.equals(intent.getAction())) {
			this.appView.loadUrl("javascript:app.navigateToPage('" + intent.getData().toString().replace("'","\\\'") + "');");
		}
    }

    @Override
    public void onReceivedError(final int errorCode, final String description, final String failingUrl) {
    	// no-op!
    }
}