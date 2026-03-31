observations i have... i noticed that the the qr on the `/dashboard/create` step 3 is defferent from what is on the `/dashboard/` they different the one in `/dashboard/create` is a statsic qr and the one in `/dashboard/` is a dynamic one, and the perfect thing is that the both should be dynamic, and also then the deigns aplied in the `/dashboard/create` should be pplied to the qr on `/dashboard/`  too.. then make the download button wrk.. do this and i will tell u my other observations

Let me break this into a clear TODO list and so u tackle them one at a time.

TODO:

✅ Add download method to useQRCode hook(done, but just verify)
✅ Dashboard QR cards: use dynamic URL (short link) instead of static content
✅ Dashboard QR codes: apply saved design/styling from the creation wizard
✅ Make the Download button functional
✅ Creation wizard: All QRs are now dynamic by default

TODO (Next Observations):
✅ Pencil (edit) icon on QR card should be always visible (not just on hover)
✅ Fix QR clipping in dashboard card (adjust container/padding/object-fit)
✅ Ensure downloaded QR code matches the design/styling shown on the dashboard
✅ Fix build errors (unused variables)
