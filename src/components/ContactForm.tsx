"use client";

function FocusInput({
  id,
  name,
  type = "text",
  autoComplete,
  label,
  required,
}: {
  id: string;
  name: string;
  type?: string;
  autoComplete?: string;
  label: string;
  required?: boolean;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="label-caps block mb-2"
        style={{ color: "var(--text-dim)" }}
      >
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        autoComplete={autoComplete}
        required={required}
        className="w-full px-4 py-3 text-sm bg-transparent transition-colors"
        style={{
          border: "1px solid var(--line)",
          color: "var(--text)",
          outline: "none",
        }}
        onFocus={(e) =>
          (e.currentTarget.style.borderColor = "var(--accent)")
        }
        onBlur={(e) =>
          (e.currentTarget.style.borderColor = "var(--line)")
        }
      />
    </div>
  );
}

export default function ContactForm() {
  return (
    <form
      action="mailto:rob@robcazin.com"
      method="POST"
      encType="text/plain"
      aria-label="Contact form"
    >
      <div className="space-y-5">
        <FocusInput
          id="contact-name"
          name="name"
          label="Name"
          autoComplete="name"
          required
        />
        <FocusInput
          id="contact-email"
          name="email"
          type="email"
          label="Email"
          autoComplete="email"
          required
        />

        <div>
          <label
            htmlFor="contact-message"
            className="label-caps block mb-2"
            style={{ color: "var(--text-dim)" }}
          >
            Message
          </label>
          <textarea
            id="contact-message"
            name="message"
            rows={5}
            required
            className="w-full px-4 py-3 text-sm bg-transparent resize-none"
            style={{
              border: "1px solid var(--line)",
              color: "var(--text)",
              outline: "none",
            }}
            onFocus={(e) =>
              (e.currentTarget.style.borderColor = "var(--accent)")
            }
            onBlur={(e) =>
              (e.currentTarget.style.borderColor = "var(--line)")
            }
          />
        </div>

        <button
          type="submit"
          className="px-6 py-3 text-sm font-medium transition-all hover:opacity-80"
          style={{ background: "var(--accent)", color: "#0a0b0d" }}
        >
          Send Message
        </button>
      </div>
    </form>
  );
}
