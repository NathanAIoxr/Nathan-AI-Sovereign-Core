package com.nathantabor.hatettes.unbound;

import android.app.Activity;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.os.Build;
import android.view.View;
import android.view.WindowInsets;
import android.widget.AdapterView;
import android.widget.ArrayAdapter;
import android.widget.Button;
import android.widget.CheckBox;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.Spinner;
import android.widget.TextView;
import org.json.JSONArray;
import org.json.JSONObject;
import java.io.InputStream;
import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

public final class RealmActivity extends Activity {
    private JSONArray realms;
    private JSONArray materials;
    private JSONArray headwear;
    private JSONObject winterPair;
    private SharedPreferences save;
    private LinearLayout page;
    private Spinner realm;
    private Spinner letter;
    private Spinner material;
    private CheckBox reverse;
    private CheckBox winter;
    private TextView realmCopy;
    private TextView progress;
    private TextView pairText;
    private TextView clue;
    private TextView dial;
    private TextView status;
    private Button claim;
    private final List<String> turns = new ArrayList<>();
    private Set<String> claims;
    private Set<String> gates;

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        ScrollView scroll = new ScrollView(this);
        page = new LinearLayout(this);
        page.setOrientation(LinearLayout.VERTICAL);
        int pad = Math.round(20 * getResources().getDisplayMetrics().density);
        page.setPadding(pad, pad, pad, pad);
        scroll.addView(page);
        setContentView(scroll);
        if (Build.VERSION.SDK_INT >= 30) {
            scroll.setOnApplyWindowInsetsListener((view, insets) -> {
                android.graphics.Insets bars = insets.getInsets(WindowInsets.Type.systemBars());
                view.setPadding(bars.left, bars.top, bars.right, bars.bottom);
                return insets;
            });
        }
        label("Hatettes UNBOUND", 30);
        try (InputStream source = getAssets().open("realms.json")) {
            ByteArrayOutputStream bytes = new ByteArrayOutputStream();
            byte[] buffer = new byte[4096];
            int count;
            while ((count = source.read(buffer)) != -1) bytes.write(buffer, 0, count);
            JSONObject data = new JSONObject(new String(bytes.toByteArray(), StandardCharsets.UTF_8));
            realms = data.getJSONArray("realms");
            materials = data.getJSONArray("materials");
            headwear = data.getJSONArray("headwear");
            winterPair = data.getJSONObject("winter");
        } catch (Exception error) {
            label("The realm catalog could not be loaded.", 18);
            return;
        }
        save = getSharedPreferences("unbound", MODE_PRIVATE);
        claims = new HashSet<>(save.getStringSet("claims", Collections.emptySet()));
        gates = new HashSet<>(save.getStringSet("gates", Collections.emptySet()));
        realm = picker("Realm", names(realms, "name"));
        realm.setSelection(Math.max(0, Math.min(realms.length() - 1, save.getInt("realm", 1))));
        realmCopy = label("", 16);
        progress = label("", 16);
        reverse = checkbox("Z to A");
        letter = picker("Letter", letters(false));
        material = picker("Material", names(materials, null));
        winter = checkbox("Santa’s cap & Solstice Crown");
        pairText = label("", 20);
        claim = button("Claim pair", this::claim);
        clue = label("", 16);
        button("π Pi", () -> turn("π"));
        button("φ Phi", () -> turn("φ"));
        dial = label("", 16);
        button("Try the gate", this::open);
        status = label("", 16);
        status.setAccessibilityLiveRegion(View.ACCESSIBILITY_LIVE_REGION_POLITE);
        listen(realm, () -> {
            turns.clear();
            status.setText("");
            save.edit().putInt("realm", realm.getSelectedItemPosition()).apply();
            render();
        });
        listen(letter, this::render);
        listen(material, this::render);
        reverse.setOnCheckedChangeListener((view,checked) -> {
            int old = letter.getSelectedItemPosition();
            setOptions(letter, letters(checked));
            letter.setSelection(25 - old);
            render();
        });
        winter.setOnCheckedChangeListener((view,checked) -> render());
        render();
    }

    private TextView label(String text, int size) {
        TextView view = new TextView(this);
        view.setText(text);
        view.setTextSize(size);
        view.setPadding(0, 8, 0, 8);
        page.addView(view);
        return view;
    }

    private CheckBox checkbox(String title) {
        CheckBox view = new CheckBox(this);
        view.setText(title);
        page.addView(view);
        return view;
    }

    private Button button(String text, Runnable action) {
        Button view = new Button(this);
        view.setText(text);
        view.setOnClickListener(ignored -> action.run());
        page.addView(view);
        return view;
    }

    private Spinner picker(String title, List<String> values) {
        TextView name = label(title, 15);
        Spinner view = new Spinner(this);
        view.setId(View.generateViewId());
        name.setLabelFor(view.getId());
        setOptions(view, values);
        page.addView(view);
        return view;
    }

    private void setOptions(Spinner view, List<String> values) {
        ArrayAdapter<String> adapter = new ArrayAdapter<>(this, android.R.layout.simple_spinner_item, values);
        adapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item);
        view.setAdapter(adapter);
    }

    private void listen(Spinner spinner, Runnable action) {
        spinner.setOnItemSelectedListener(new AdapterView.OnItemSelectedListener() {
            @Override public void onItemSelected(AdapterView<?> parent, View view, int position, long id) { action.run(); }
            @Override public void onNothingSelected(AdapterView<?> parent) {}
        });
    }

    private List<String> names(JSONArray data, String key) {
        List<String> out = new ArrayList<>();
        for (int i = 0; i < data.length(); i++) {
            out.add(key == null ? data.optString(i) : data.optJSONObject(i).optString(key));
        }
        return out;
    }

    private List<String> letters(boolean reversed) {
        List<String> result = new ArrayList<>();
        for (int i = 0; i < 26; i++) result.add(String.valueOf((char) ('A' + (reversed ? 25 - i : i))));
        return result;
    }

    private int letterIndex() {
        int index = Math.max(0, letter.getSelectedItemPosition());
        return reverse.isChecked() ? 25 - index : index;
    }

    private String realmPrefix() { return realm.getSelectedItemPosition() + "."; }

    private String pairId() {
        return winter.isChecked() ? winterPair.optString("id")
            : realmPrefix() + letterIndex() + "." + material.getSelectedItemPosition();
    }

    private JSONObject selectedRealm() { return realms.optJSONObject(Math.max(0, realm.getSelectedItemPosition())); }

    private void render() {
        JSONObject selected = selectedRealm();
        String hat = materials.optString(material.getSelectedItemPosition()) + " " + headwear.optString(letterIndex());
        pairText.setText(winter.isChecked() ? winterPair.optString("hat") + " ↔ " + winterPair.optString("hatette") : hat + " ↔ " + hat + " Hatette");
        boolean owned = claims.contains(pairId());
        claim.setEnabled(!owned);
        claim.setText(owned ? "Pair claimed" : "Claim pair");
        realmCopy.setText(selected.optString("copy"));
        progress.setText(claims.size() + " pairs claimed · " + gates.size() + " of " + realms.length() + " gates opened");
        JSONArray pattern = selected.optJSONArray("turns");
        clue.setText("Set " + (selected.optBoolean("reverse") ? "Z to A" : "A to Z") + " and tune " + pattern.optString(0) + " → " + pattern.optString(1) + ".");
        dial.setText(turns.isEmpty() ? "Dial ready" : String.join(" → ", turns));
    }

    private void claim() {
        claims.add(pairId());
        save.edit().putStringSet("claims", new HashSet<>(claims)).apply();
        status.setText("Pair claimed.");
        render();
    }

    private void turn(String symbol) {
        turns.add(symbol);
        if (turns.size() > 2) turns.remove(0);
        status.setText("");
        render();
    }

    private void open() {
        JSONObject target = selectedRealm();
        JSONArray pattern = target.optJSONArray("turns");
        boolean ownsPair = claims.stream().anyMatch(id -> id.startsWith(realmPrefix()));
        if (!ownsPair || reverse.isChecked() != target.optBoolean("reverse") || !turns.equals(Arrays.asList(pattern.optString(0), pattern.optString(1)))) {
            status.setText("The gate is locked. Match the clue and claim a realm pair.");
            return;
        }
        gates.add(String.valueOf(realm.getSelectedItemPosition()));
        save.edit().putStringSet("gates", new HashSet<>(gates)).apply();
        status.setText(gates.size() == realms.length() ? "All six gates cleared. DONE." : "Gate open. The forced labels are cleared in " + target.optString("name") + ".");
        render();
    }
}
