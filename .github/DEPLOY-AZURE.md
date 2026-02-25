# Deploy to Azure (ACR + Web App)

The workflow **Deploy to Azure (ACR + Web App)** runs only when triggered manually from the Actions tab.

## 1. Set workflow variables

Edit [`.github/workflows/azure-deploy.yml`](../workflows/azure-deploy.yml) and set the `env` block at the top:

- **ACR_NAME** – Registry resource name (for `az acr login`). In Portal: ACR → Overview → **Name** (e.g. `myregistry`).
- **ACR_LOGIN_SERVER** – Full login server hostname for push/deploy. In Portal: ACR → Overview → **Login server** (e.g. `myregistry.azurecr.io` or `myregistry-xxxx.azurecr.io` if Azure added a suffix).
- **IMAGE_NAME** – Name used for the image in ACR (e.g. `portfolio`). Full image: `<ACR_LOGIN_SERVER>/<IMAGE_NAME>:<tag>`.
- **WEBAPP_NAME** – Name of the Azure Web App (Linux, container-based).

## 2. GitHub secrets

In the repo: **Settings → Secrets and variables → Actions**, add:

| Secret | Description |
|--------|-------------|
| **AZURE_CREDENTIALS** | JSON for a service principal that can push to ACR and (optionally) manage the Web App. See below. |
| **AZURE_WEBAPP_PUBLISH_PROFILE** | Web App publish profile (download from Azure Portal → Web App → **Get publish profile**). |

### AZURE_CREDENTIALS JSON

Create an Azure service principal (e.g. with Azure CLI):

```bash
az ad sp create-for-rbac --name "github-<your-repo>" --role contributor \
  --scopes /subscriptions/<SUBSCRIPTION_ID>/resourceGroups/<RESOURCE_GROUP> \
  --sdk-auth
```

Use the JSON output as the value of `AZURE_CREDENTIALS`. The identity must have:

- **Contributor** (or **AcrPush** for the ACR and **Website Contributor** for the Web App) on the resource group or the specific ACR and Web App resources.

## 3. Web App and ACR setup

### 3.1 Create the Web App (Linux + container)

You need a **Linux** Web App that runs a **Docker container** (not “code” deployment).

**In Azure Portal:**

1. **Create Web App**  
   **Create a resource** → **Web App** → **Create**.

2. **Basics**
   - **Subscription** / **Resource group**: choose or create one (same as your ACR if you like).
   - **Name**: pick a unique name (e.g. `mywebsite-prod`). This is your **WEBAPP_NAME** in the workflow.
   - **Publish**: choose **Docker Container**.
   - **Operating System**: **Linux**.
   - **Region**: any.

3. **Docker (on the same Create screen)**
   - **Options**: **Single Container**.
   - **Image Source**: **Azure Container Registry**.
   - **Registry**: select your ACR.
   - **Image**: pick any existing image/tag for now (e.g. `website:latest`), or leave default—the GitHub Action will overwrite this on first deploy.
   - **Startup Command**: leave blank unless you need a custom `docker run` command.

4. **Create** the Web App.

5. **App listens on port 8080**  
   In the Web App → **Configuration** → **Application settings**, add:
   - Name: `WEBSITES_PORT`  
   - Value: `8080`  
   Then **Save**.

6. **Publish profile (for GitHub)**  
   In the Web App → **Overview** → **Get publish profile**. Download the file and paste its **entire contents** into the GitHub secret **AZURE_WEBAPP_PUBLISH_PROFILE**.

---

### 3.2 Let the Web App pull images from ACR

The Web App must be allowed to pull from your Azure Container Registry. Use **one** of the two options below.

#### Option A: Managed identity (recommended, no passwords)

1. **Turn on the Web App’s identity**  
   Web App → **Identity** → **System assigned** → set **Status** to **On** → **Save**. Note the **Object (principal) ID** (you can use it to find the identity in ACR).

2. **Grant the Web App pull access to ACR**  
   - Open your **Azure Container Registry** in the portal.
   - **Access control (IAM)** → **Add** → **Add role assignment**.
   - **Role**: **AcrPull**.
   - **Members**: **User, group, or service principal** → **Select members** → search for your Web App name (it appears as a service principal). Select it → **Review + assign**.

The Web App will now pull images from ACR using its managed identity. No registry username/password needed in the Web App.

#### Option B: ACR admin user (username + password)

1. **Enable admin user on ACR**  
   ACR → **Access keys** → set **Admin user** to **Enable**. Copy the **Login server**, **Username**, and one of the **Password** values.

2. **Store them in the Web App**  
   Web App → **Configuration** → **Application settings** → **New application setting**. Add these three (replace placeholders with your ACR name and the values from step 1):

   | Name | Value |
   |------|--------|
   | `DOCKER_REGISTRY_SERVER_URL` | `https://<ACR_LOGIN_SERVER>` (use the exact Login server from ACR → Overview) |
   | `DOCKER_REGISTRY_SERVER_USERNAME` | (ACR username from Access keys) |
   | `DOCKER_REGISTRY_SERVER_PASSWORD` | (ACR password from Access keys) |

   **Save** the configuration.

After either option, the first time you run the GitHub Action it will push a new image to ACR and deploy that image to the Web App. Later runs will update the image and redeploy.

## 4. Run the workflow

1. Open the repo on GitHub → **Actions**.
2. Select **Deploy to Azure (ACR + Web App)**.
3. Click **Run workflow**, optionally set **Docker image tag** (default is the git SHA).
4. After the run completes, the Web App will use the new image from ACR.
