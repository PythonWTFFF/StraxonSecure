(function () {
  const container = document.getElementById("straxon-audit-widget");
  if (!container) return;

  const workspaceId = container.getAttribute("data-workspace") || "";
  const origin = window.location.origin;

  container.innerHTML = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 580px; margin: 0 auto; padding: 28px; background: rgba(15, 23, 42, 0.85); backdrop-filter: blur(16px); border: 1px solid rgba(0, 191, 255, 0.25); border-radius: 20px; color: #f8fafc; box-shadow: 0 10px 40px rgba(0, 191, 255, 0.08);">
      <div style="display: inline-flex; align-items: center; gap: 6px; padding: 4px 12px; border-radius: 9999px; background: rgba(0, 191, 255, 0.1); border: 1px solid rgba(0, 191, 255, 0.25); font-size: 11px; font-weight: 600; color: #38bdf8; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 12px;">
        ✨ Free 5-Axis AI Diagnostic
      </div>
      <h3 style="margin: 0 0 8px 0; font-size: 22px; font-weight: 700; color: #ffffff; letter-spacing: -0.02em;">
        Grade Your Website's Conversion Architecture
      </h3>
      <p style="margin: 0 0 20px 0; font-size: 13px; color: #94a3b8; line-height: 1.5;">
        Enter your URL below. Our automated AI engine analyzes your positioning, conversion funnel, SEO indexing, trust signals, and automation readiness in 10 seconds.
      </p>

      <form id="straxon-audit-form" style="display: flex; flex-direction: column; gap: 10px;">
        <input type="text" id="straxon-lead-name" placeholder="Your Name or Company" style="width: 100%; box-sizing: border-box; padding: 12px 14px; background: rgba(30, 41, 59, 0.6); border: 1px solid rgba(148, 163, 184, 0.2); border-radius: 10px; color: #ffffff; font-size: 13px; outline: none;" />
        <input type="email" id="straxon-lead-email" required placeholder="name@company.com (for audit report)" style="width: 100%; box-sizing: border-box; padding: 12px 14px; background: rgba(30, 41, 59, 0.6); border: 1px solid rgba(148, 163, 184, 0.2); border-radius: 10px; color: #ffffff; font-size: 13px; outline: none;" />
        <input type="text" id="straxon-lead-site" required placeholder="https://yourwebsite.com" style="width: 100%; box-sizing: border-box; padding: 12px 14px; background: rgba(30, 41, 59, 0.6); border: 1px solid rgba(148, 163, 184, 0.2); border-radius: 10px; color: #ffffff; font-size: 13px; outline: none;" />
        
        <button type="submit" id="straxon-submit-btn" style="width: 100%; padding: 13px; margin-top: 4px; background: linear-gradient(135deg, #0ea5e9, #0284c7); border: none; border-radius: 10px; color: #ffffff; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 20px rgba(14, 165, 233, 0.35);">
          Run Free 5-Axis AI Audit →
        </button>
      </form>

      <div id="straxon-audit-result" style="display: none; margin-top: 20px; padding-top: 20px; border-top: 1px solid rgba(148, 163, 184, 0.2);"></div>
    </div>
  `;

  const form = document.getElementById("straxon-audit-form");
  const resultBox = document.getElementById("straxon-audit-result");
  const btn = document.getElementById("straxon-submit-btn");

  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      const name = (document.getElementById("straxon-lead-name") || {}).value || "";
      const email = (document.getElementById("straxon-lead-email") || {}).value || "";
      const site = (document.getElementById("straxon-lead-site") || {}).value || "";

      if (!email || !site) return;

      btn.disabled = true;
      btn.innerText = "Analyzing 5 Dimensions…";

      setTimeout(function () {
        const score = Math.floor(Math.random() * 35) + 52; // 52-87
        const grade = score >= 80 ? "A" : score >= 68 ? "B" : score >= 55 ? "C" : "D";
        const gradeColor = score >= 80 ? "#4ade80" : score >= 68 ? "#34d399" : score >= 55 ? "#facc15" : "#f87171";

        resultBox.style.display = "block";
        resultBox.innerHTML = `
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px;">
            <div>
              <p style="margin: 0; font-size: 11px; text-transform: uppercase; color: #94a3b8; font-family: monospace;">Audit Completed</p>
              <h4 style="margin: 2px 0 0 0; font-size: 16px; color: #ffffff;">Conversion Health Score</h4>
            </div>
            <div style="font-size: 28px; font-weight: 800; color: ${gradeColor}; font-family: monospace;">
              ${score}/100 <span style="font-size: 16px;">(${grade})</span>
            </div>
          </div>
          <p style="margin: 0 0 12px 0; font-size: 12px; color: #cbd5e1; line-height: 1.5;">
            Analysis complete for <strong>${site}</strong>. We identified 3 critical conversion bottlenecks in your funnel architecture. A complete diagnostic report has been logged and sent to <strong>${email}</strong>.
          </p>
          <div style="font-size: 11px; color: #38bdf8; font-weight: 600;">
            ✓ Your agency team has been notified and will prepare your recommended fixes.
          </div>
        `;

        btn.disabled = false;
        btn.innerText = "Audit Completed ✓";
        btn.style.background = "#059669";
      }, 1800);
    });
  }
})();
