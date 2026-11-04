Subject: Custom activation and password-reset link address for a Blocks project

Hi SELISE Blocks team,

Our project (tenant `Dedabcfe99cfc4be99ecd89612938e7aa`, app domain `https://dbkxli-erofh.slsblx.com`) uses its own sign-in, activation and password-reset screens, built on `@seliseblocks/client` (`auth.signup`, `auth.activate`, `auth.recover`, `auth.resetPassword`).

The emails Blocks sends still link to the hosted Blocks pages, because the templates only get a finished link:

- `AccountActivation` uses `{{AccountActivationUrl}}`
- `RecoverAccount` uses `{{EmailVerification.PageUrl}}`

We'd like those links to open our pages instead:

- `https://dbkxli-erofh.slsblx.com/activate?code=<activation code>`
- `https://dbkxli-erofh.slsblx.com/reset-password?code=<reset code>`

Could you tell us either:

1. Whether the base address of these links can be configured per project (or per OIDC client), and how; or
2. Whether the templates can use a placeholder for the bare activation code and reset code, so we can build the link ourselves.

Two smaller questions while we're here:

- `auth.resendActivation` asks for a `userId`. Is there a supported way for a signed-out user to request a new activation email by email address?
- Is the project's password policy available to a signed-out page, so we can show the rules before someone types a password?

Thanks,
Limereel
