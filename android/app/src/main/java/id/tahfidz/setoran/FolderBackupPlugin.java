package id.tahfidz.setoran;

import android.app.Activity;
import android.content.ContentResolver;
import android.content.Intent;
import android.database.Cursor;
import android.net.Uri;
import android.provider.DocumentsContract;
import androidx.activity.result.ActivityResult;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * Cadangan otomatis ke folder pilihan pengguna.
 *
 * pickFolder: membuka pemilih folder bawaan Android, lalu menyimpan izin akses folder itu
 * agar tetap berlaku setelah aplikasi ditutup. Tidak memerlukan izin penyimpanan.
 * write: menulis satu berkas teks ke folder itu (menimpa bila namanya sudah ada) dan
 * menghapus berkas cadangan otomatis yang lebih lama dari batas simpan.
 */
@CapacitorPlugin(name = "FolderBackup")
public class FolderBackupPlugin extends Plugin {

    private static final int RW = Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_WRITE_URI_PERMISSION;

    @PluginMethod
    public void pickFolder(PluginCall call) {
        Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT_TREE);
        intent.addFlags(RW | Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION);
        startActivityForResult(call, intent, "pickFolderResult");
    }

    @ActivityCallback
    private void pickFolderResult(PluginCall call, ActivityResult result) {
        if (call == null) return;
        Intent data = result.getData();
        if (result.getResultCode() != Activity.RESULT_OK || data == null || data.getData() == null) {
            call.reject("Dibatalkan");
            return;
        }
        Uri tree = data.getData();
        try {
            getContext().getContentResolver().takePersistableUriPermission(tree, RW);
        } catch (Exception e) {
            call.reject("Folder tidak bisa dipakai: " + e.getMessage());
            return;
        }
        JSObject out = new JSObject();
        out.put("uri", tree.toString());
        out.put("name", folderLabel(tree));
        call.resolve(out);
    }

    /** Nama folder yang mudah dibaca, mis. "Documents/Cadangan" dari id "primary:Documents/Cadangan". */
    private String folderLabel(Uri tree) {
        try {
            String id = DocumentsContract.getTreeDocumentId(tree);
            int colon = id.indexOf(':');
            String volume = colon >= 0 ? id.substring(0, colon) : "";
            String path = colon >= 0 ? id.substring(colon + 1) : id;
            String where = "primary".equals(volume) ? "Penyimpanan HP" : "Kartu SD";
            return path.isEmpty() ? where : where + "/" + path;
        } catch (Exception e) {
            return "Folder pilihan";
        }
    }

    @PluginMethod
    public void write(final PluginCall call) {
        final String treeUri = call.getString("treeUri");
        final String name = call.getString("name");
        final String text = call.getString("text");
        final String prefix = call.getString("prefix", "");
        final int keep = call.getInt("keep", 7);
        if (treeUri == null || name == null || text == null) {
            call.reject("Parameter tidak lengkap");
            return;
        }
        getBridge().execute(() -> {
            try {
                ContentResolver resolver = getContext().getContentResolver();
                Uri tree = Uri.parse(treeUri);
                String treeId = DocumentsContract.getTreeDocumentId(tree);
                Uri dir = DocumentsContract.buildDocumentUriUsingTree(tree, treeId);
                Uri children = DocumentsContract.buildChildDocumentsUriUsingTree(tree, treeId);

                String existingId = null;
                List<String[]> backups = new ArrayList<>(); // {nama, id}
                String[] cols = { DocumentsContract.Document.COLUMN_DOCUMENT_ID, DocumentsContract.Document.COLUMN_DISPLAY_NAME };
                try (Cursor c = resolver.query(children, cols, null, null, null)) {
                    while (c != null && c.moveToNext()) {
                        String id = c.getString(0);
                        String display = c.getString(1);
                        if (display == null) continue;
                        if (display.equals(name)) existingId = id;
                        if (!prefix.isEmpty() && display.startsWith(prefix) && display.endsWith(".json")) backups.add(new String[] { display, id });
                    }
                }

                Uri target = existingId != null
                    ? DocumentsContract.buildDocumentUriUsingTree(tree, existingId)
                    : DocumentsContract.createDocument(resolver, dir, "application/json", name);
                if (target == null) throw new Exception("Berkas tidak bisa dibuat di folder ini");
                try (OutputStream os = resolver.openOutputStream(target, "wt")) {
                    if (os == null) throw new Exception("Berkas tidak bisa ditulis");
                    os.write(text.getBytes(StandardCharsets.UTF_8));
                }

                // Hapus cadangan otomatis yang paling lama, sisakan `keep` berkas terbaru (nama memuat tanggal).
                if (existingId == null) backups.add(new String[] { name, "" });
                Collections.sort(backups, (a, b) -> b[0].compareTo(a[0]));
                for (int i = Math.max(keep, 1); i < backups.size(); i++) {
                    String id = backups.get(i)[1];
                    if (id.isEmpty()) continue;
                    try {
                        DocumentsContract.deleteDocument(resolver, DocumentsContract.buildDocumentUriUsingTree(tree, id));
                    } catch (Exception ignored) {
                        // berkas lama yang gagal dihapus tidak menggagalkan cadangan
                    }
                }
                call.resolve();
            } catch (Exception e) {
                call.reject(e.getMessage() != null ? e.getMessage() : "Gagal menulis cadangan");
            }
        });
    }
}
