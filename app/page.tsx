import ContactForm from "@/components/ContactForm";
import Image from 'next/image';

export default function Home() {
  return (
    <main className="flex-shrink-0">
      {/* HERO SECTION */}
      <header className="py-30 bg-light border-bottom" id="top">
        <div className="container px-5 py-5">
          <div className="row gx-5 align-items-center">
            <div className="col-xxl-5">
              <div className="text-center text-xxl-start mb-4">
                <h1 className="display-4 fw-bolder mb-3">
                  <span className="text-gradient d-inline">Bible Study Buddy</span>
                </h1>
                <p className="lead text-muted">
                  Organize your Bible study with the help of AI
                </p>
                <a className="btn btn-primary btn-lg px-5 py-3 me-sm-3 fs-6 fw-bolder" href="#about">
                  Learn More
                </a>
                <a className="btn btn-outline-dark btn-lg px-5 py-3 fs-6 fw-bolder" href="#contact">
                  Contact Us
                </a>
              </div>
            </div>

            <div className="col-xxl-7 text-center">
              <div
                className="profile bg-gradient-primary-to-secondary"
                style={{
                  position: "relative",
                  width: "100%",
                  maxWidth: "600px",
                  aspectRatio: "1 / 1",
                  borderRadius: "50%",
                  overflow: "hidden",
                  margin: "0 auto",
                }}
              >
                <Image
                  src="/profile.png"
                  alt="App preview"
                  fill
                  style={{ objectFit: 'cover' }}
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ABOUT SECTION */}
      <section className="py-50" id="about">
        <div className="container px-5 py-5">
          <div className="row gx-5 align-items-center">
            <div className="col-md-6">
              <h2 className="fw-bolder">What is this tool?</h2>
              <p className="lead text-muted">
                The AI Bible Assistant helps you engage with the Bible in a whole new way. You can put together a reading plan with in depth AI assistance to help you understand and apply Scripture.
              </p>
            </div>
            <div className="col-md-6 text-center">
              <Image
                src="/dashboard-preview.png"
                alt="Dashboard preview"
                width={800} // adjust width as needed
                height={600} // adjust height as needed
                className="rounded shadow"
              />
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section className="py-40 bg-light border-top border-bottom" id="features">
        <div className="container px-5 py-5">
          <div className="text-center mb-5">
            <h2 className="fw-bolder">Why You&#39;ll Love It</h2>
            <p className="text-muted">
              Simple tools, powerful results. Everything you need to focus, create, and grow in Christ.
            </p>
          </div>
          <div className="row gx-5">
            <div className="col-md-4 mb-4">
              <div className="text-center">
                <div className="feature bg-primary bg-gradient text-white rounded-3 mb-3 p-3">
                  <i className="bi bi-bullseye"></i>
                </div>
                <h5>Plan</h5>
                <p className="text-muted">
                  Plan your Bible reading with AI-generated study plans tailored to your goals and interests. 
                </p>
              </div>
            </div>
            <div className="col-md-4 mb-4">
              <div className="text-center">
                <div className="feature bg-primary bg-gradient text-white rounded-3 mb-3 p-3">
                  <i className="bi bi-bar-chart"></i>
                </div>
                <h5>Groups</h5>
                <p className="text-muted">
                  Use the organized group calendar to keep track of meetings, add study reminders, and communicate with your group.
                </p>
              </div>
            </div>
            <div className="col-md-4 mb-4">
              <div className="text-center">
                <div className="feature bg-primary bg-gradient text-white rounded-3 mb-3 p-3">
                  <i className="bi bi-people"></i>
                </div>
                <h5>Built for the Busy</h5>
                <p className="text-muted">
                  Designed to fit into your busy life, helping you stay consistent with your Bible reading.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* FINAL CTA SECTION */}
      <section className="py-35 text-center bg-gradient-primary-to-secondary text-white" id="contact">
        <ContactForm />
      </section>
    </main>
  );
}
