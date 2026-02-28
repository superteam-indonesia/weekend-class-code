# Contributing / Cara Berkontribusi

Contributing guidelines in two languages.  
Pedoman berkontribusi dalam dua bahasa.

---

## English

### How to contribute

We welcome contributions. Please follow these guidelines so we can review and merge your work smoothly.

#### 1. Use a fork for pull requests

- **Do not** open pull requests from branches on this repository.
- **Fork** the repository to your own GitHub account.
- Create your changes in a branch **in your fork**.
- Open a **pull request** from your fork’s branch into this repository’s default branch (e.g. `main`).

This keeps the main repo clean and makes it clear that contributions come from the community.

#### 2. Check existing issues first

- **Before opening a new issue**, search the [Issues](issues) tab for similar or related issues.
- If you find an existing issue that matches:
  - Add a comment with your details or use case instead of creating a duplicate.
  - You may offer to help with that issue.
- Open a **new issue** only if you don’t find anything relevant. When opening one, give a clear title and description so others can understand and help.

This reduces duplicate issues and keeps the issue list manageable.

#### 3. Use conventional commits

We use **[Conventional Commits](https://www.conventionalcommits.org/)** for commit messages and pull request titles. This keeps history readable and works well with changelogs and tooling.

**Format:** `type(scope): short description`

**Types:**

| Type       | Use for |
|-----------|---------|
| `feat`    | New feature |
| `fix`     | Bug fix |
| `docs`    | Documentation only |
| `style`   | Formatting, no code change (e.g. whitespace) |
| `refactor`| Code change that is not a fix nor a feature |
| `test`    | Adding or updating tests |
| `chore`   | Build, tooling, dependencies, etc. |

**Examples:**

- `feat(lesson-3): add NFT metadata fields`
- `fix(nft-membership): correct mint authority check`
- `docs(readme): fix install commands`
- `chore(deps): bump @solana/web3.js`

- Use the **imperative** and **lowercase** after the type: “add” not “added”, “fix” not “fixes”.
- Optionally add a **body** and **footer** (e.g. `BREAKING CHANGE:`, `Fixes #123`).

**Pull requests:** Use a conventional-commit-style **title** for your PR (e.g. `feat(lesson-3): add NFT metadata fields`). You can add more detail in the PR description.

#### 4. Pull request process

1. Fork the repo and clone your fork locally.
2. Create a branch (e.g. `fix/typo-readme` or `feat/add-example`).
3. Make your changes and test them.
4. **Commit with conventional commit messages** (see above).
5. Push to your fork and open a pull request **from your fork** to this repo.
6. Use a **conventional-commit-style title** for the PR and fill in the PR template (if any); reference related issues.

Thank you for contributing.

---

## Bahasa Indonesia

### Cara berkontribusi

Kami menerima kontribusi. Ikuti pedoman berikut agar kami bisa meninjau dan menggabungkan perubahan Anda dengan lancar.

#### 1. Gunakan fork untuk pull request

- **Jangan** membuat pull request dari branch di repository ini.
- **Fork** repository ini ke akun GitHub Anda.
- Buat perubahan di sebuah branch **di fork Anda**.
- Buka **pull request** dari branch di fork Anda ke branch default repository ini (misalnya `main`).

Dengan begitu, repository utama tetap rapi dan jelas bahwa kontribusi berasal dari komunitas.

#### 2. Cek issue yang sudah ada terlebih dahulu

- **Sebelum membuat issue baru**, cari di tab [Issues](issues) apakah sudah ada issue yang sama atau terkait.
- Jika sudah ada issue yang sesuai:
  - Tambahkan komentar dengan detail atau kasus Anda, jangan buat issue duplikat.
  - Anda bisa menawarkan bantuan untuk issue tersebut.
- **Buat issue baru** hanya jika tidak ada yang relevan. Saat membuat, beri judul dan deskripsi yang jelas agar orang lain bisa paham dan membantu.

Ini mengurangi issue duplikat dan menjaga daftar issue tetap tertata.

#### 3. Gunakan conventional commits

Kami memakai **[Conventional Commits](https://www.conventionalcommits.org/)** untuk pesan commit dan judul pull request. Ini membuat riwayat mudah dibaca dan cocok untuk changelog serta alat bantu.

**Format:** `type(scope): deskripsi singkat`

**Tipe:**

| Tipe       | Untuk |
|-----------|--------|
| `feat`    | Fitur baru |
| `fix`     | Perbaikan bug |
| `docs`    | Hanya dokumentasi |
| `style`   | Formatting, tanpa perubahan logika (mis. spasi) |
| `refactor`| Perubahan kode yang bukan fix maupun fitur |
| `test`    | Menambah atau mengubah tes |
| `chore`   | Build, tooling, dependensi, dll. |

**Contoh:**

- `feat(lesson-3): tambah field metadata NFT`
- `fix(nft-membership): perbaiki pengecekan mint authority`
- `docs(readme): perbaiki perintah instalasi`
- `chore(deps): update @solana/web3.js`

- Gunakan **imperatif** dan **huruf kecil** setelah tipe: “tambah” bukan “menambahkan”, “perbaiki” bukan “memperbaiki”.
- Opsional: tambahkan **body** dan **footer** (mis. `BREAKING CHANGE:`, `Fixes #123`).

**Pull request:** Gunakan **judul** PR yang mengikuti gaya conventional commit (mis. `feat(lesson-3): tambah field metadata NFT`). Detail tambahan bisa ditulis di deskripsi PR.

#### 4. Proses pull request

1. Fork repo ini dan clone fork Anda ke komputer.
2. Buat branch (misalnya `fix/typo-readme` atau `feat/tambah-contoh`).
3. Lakukan perubahan dan uji.
4. **Commit dengan pesan conventional commit** (lihat di atas).
5. Push ke fork Anda dan buka pull request **dari fork Anda** ke repo ini.
6. Gunakan **judul PR gaya conventional commit** dan isi template PR (jika ada); cantumkan issue terkait.

Terima kasih telah berkontribusi.
