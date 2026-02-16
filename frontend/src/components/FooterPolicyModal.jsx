import React from 'react';
import { X, Shield, FileText, Lock, Activity, Users, FileQuestion, Cookie, CheckCircle, ChevronDown, ChevronUp, Handshake, Megaphone, Share2, ShieldCheck, Code } from 'lucide-react';
import axios from 'axios';

const FooterPolicyModal = ({ isOpen, onClose, type }) => {
    const [openFaq, setOpenFaq] = React.useState(null);
    const [nestedPopup, setNestedPopup] = React.useState(null);

    const [user, setUser] = React.useState(null);

    React.useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    }, []);

    const handleSubmit = async (e, formType) => {
        e.preventDefault();
        const form = e.target;
        const formData = new FormData(form);
        const userId = user ? (user._id || user.id) : null;

        try {
            if (formType === 'developer') {
                // Developer application with file upload
                const payload = new FormData();
                payload.append('type', formType);
                if (userId) payload.append('userId', userId);

                const dataObj = {};
                formData.forEach((value, key) => {
                    if (key !== 'cv') {
                        dataObj[key] = value;
                    }
                });
                payload.append('formData', JSON.stringify(dataObj));

                const cvFile = formData.get('cv');
                if (cvFile) {
                    payload.append('cv', cvFile);
                }

                await axios.post(`${import.meta.env.VITE_API_URL}/api/applications`, payload, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            } else {
                // Standard application (JSON)
                const data = Object.fromEntries(formData.entries());
                await axios.post(`${import.meta.env.VITE_API_URL}/api/applications`, {
                    type: formType,
                    formData: data,
                    userId: userId
                });
            }
            alert('Application submitted successfully!');
            onClose();
        } catch (error) {
            console.error('Submission Error:', error);
            alert('Failed to submit application. Please try again.');
        }
    };

    React.useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const termsContent = (
        <div className="space-y-4 text-justify text-gray-600 text-sm leading-relaxed">
            <p>By submitting the Partner With Us application, you confirm that you are an authorized representative of the institution mentioned in the form and that you have the authority to request collaboration on its behalf. Submission of the application does not guarantee approval of partnership, and all requests are subject to internal review and verification. We reserve the right to approve or reject any application at our sole discretion based on suitability, verification results, or platform policies.</p>
            <p>You agree that all information provided in the application is accurate, complete, and truthful to the best of your knowledge. Any false, misleading, or incomplete information may result in immediate rejection of the application or termination of any future partnership agreement. If approved, specific partnership terms, responsibilities, branding permissions, access rights, and any commercial arrangements will be communicated separately and may require additional written agreements.</p>
            <p>We may modify, suspend, or discontinue partnership opportunities at any time without prior notice. By submitting the application, you acknowledge that you have read, understood, and agreed to these Terms of Service.</p>
        </div>
    );

    const privacyContent = (
        <div className="space-y-4 text-justify text-gray-600 text-sm leading-relaxed">
            <p>We are committed to protecting the privacy of institutions and representatives who submit partnership applications through our library website. When you complete the Partner With Us form, we collect information such as the institution name, contact person details, email address, phone number, location, and other relevant proposal information necessary to evaluate your request.</p>
            <p>This information is collected solely for reviewing the partnership application, verifying institutional identity, communicating regarding the request, and maintaining internal records. Your information will not be sold, rented, or shared with third parties for marketing purposes. It may only be disclosed if required by applicable law or for legitimate verification processes.</p>
            <p>We implement reasonable administrative and technical safeguards to protect submitted data from unauthorized access, misuse, or disclosure. Information will be retained only for as long as necessary to process and manage the partnership request. By submitting the application, you consent to the collection and use of your information in accordance with this Privacy Policy.</p>
        </div>
    );

    const advertiseTermsContent = (
        <div className="space-y-4 text-justify text-gray-600 text-sm leading-relaxed">
            <p>By submitting an Advertise With Us application, you confirm that you are authorized to represent the brand or organization mentioned in the form and that you have the legal right to request advertising services on its behalf. Submission of an application does not guarantee approval of the advertisement. All advertising requests are subject to review to ensure that they align with the educational values and standards of our library platform.</p>
            <p>We reserve the right to approve, reject, modify, or remove any advertisement at our sole discretion, particularly if the content is misleading, inappropriate, unlawful, unrelated to education, or inconsistent with the purpose of our platform. Only advertisements relevant to books, education, academic tools, or learning resources may be accepted.</p>
            <p>You agree that all materials submitted, including text, images, logos, and promotional content, are legally owned by you or properly licensed for use. You further confirm that the advertisement does not infringe upon any copyright, trademark, or intellectual property rights of any third party. If approved, additional advertising terms including duration, placement, payment terms, and content guidelines will be communicated separately and may require a formal agreement. We reserve the right to modify advertising policies at any time.</p>
        </div>
    );

    const advertisePrivacyContent = (
        <div className="space-y-4 text-justify text-gray-600 text-sm leading-relaxed">
            <p>We respect the privacy of advertisers and organizations submitting advertising requests through our platform. When you complete the Advertise With Us form, we collect information such as brand name, contact person details, email address, phone number, advertisement preferences, campaign details, and submitted promotional materials.</p>
            <p>This information is collected solely for evaluating advertising requests, communicating with applicants, managing advertising campaigns, and maintaining internal records. We do not sell or share your information with unrelated third parties for marketing purposes. Information may only be disclosed if required by law or necessary to enforce advertising agreements.</p>
            <p>All submitted data and promotional materials are stored securely and accessed only by authorized personnel. We take reasonable measures to protect your information from unauthorized access or misuse. By submitting the advertising application, you consent to the collection and use of your information in accordance with this Privacy Policy.</p>
        </div>
    );

    const publisherTermsContent = (
        <div className="space-y-4 text-justify text-gray-600 text-sm leading-relaxed">
            <p>By submitting a Publisher application, you confirm that you are the rightful owner of the content submitted or that you hold the necessary copyright, distribution, or publishing rights to share the material on our platform. Submission of this application does not guarantee approval or listing of books or digital content. All submissions are subject to review for quality, originality, relevance, and compliance with our platform standards.</p>
            <p>You agree that any manuscript, book sample, description, or related content provided does not infringe upon the intellectual property rights of any third party. In the event of a copyright dispute, you accept full responsibility for the submitted material. We reserve the right to remove, suspend, or reject any content that violates our policies, contains unlawful material, or fails to meet academic and ethical standards.</p>
            <p>If approved, additional publishing terms, including distribution rights, revenue sharing (if applicable), content formatting, and removal policies, may be provided separately and may require a formal agreement. By submitting the application, you acknowledge that you have read and agreed to these Terms of Service.</p>
        </div>
    );

    const publisherPrivacyContent = (
        <div className="space-y-4 text-justify text-gray-600 text-sm leading-relaxed">
            <p>When you submit a Publisher application, we collect personal and professional information such as your name, contact details, publishing type, book information, and submitted samples. This information is used solely to evaluate your request, verify ownership rights, communicate regarding the listing process, and manage publishing records.</p>
            <p>We do not sell or share your personal information with unrelated third parties. Submitted materials are reviewed internally and stored securely. By applying, you consent to the collection and use of your information in accordance with this Privacy Policy.</p>
        </div>
    );

    const moderatorTermsContent = (
        <div className="space-y-4 text-justify text-gray-600 text-sm leading-relaxed">
            <p>By submitting a Moderator application, you confirm that all information provided is accurate and truthful. Submission of the application does not guarantee selection. All applications are reviewed based on qualifications, experience, availability, and suitability for maintaining community standards within our library platform.</p>
            <p>If selected, you agree to uphold platform guidelines, maintain professionalism, protect user privacy, and handle content moderation responsibilities ethically and fairly. We reserve the right to suspend or terminate moderation privileges if guidelines are violated or responsibilities are not fulfilled appropriately.</p>
            <p>Participation as a moderator does not create an employer-employee relationship unless otherwise formally agreed in writing. By submitting the application, you acknowledge and accept these Terms of Service.</p>
        </div>
    );

    const moderatorPrivacyContent = (
        <div className="space-y-4 text-justify text-gray-600 text-sm leading-relaxed">
            <p>We collect personal information such as your name, email, educational background, availability, and resume details solely for evaluating your application and managing moderator roles. This information is used internally and accessed only by authorized administrators.</p>
            <p>Your information will not be sold or shared for marketing purposes. Data is stored securely and retained only as long as necessary for application review or role management. By applying, you consent to this collection and use of your information.</p>
        </div>
    );

    const developerTermsContent = (
        <div className="space-y-4 text-justify text-gray-600 text-sm leading-relaxed">
            <p>By submitting a Developer application, you confirm that the information provided regarding your experience, skills, and professional background is accurate and truthful. Submission of the application does not guarantee employment or contract engagement. All applications are reviewed based on technical expertise, project experience, and suitability for the platform’s development needs.</p>
            <p>If selected, additional terms regarding responsibilities, confidentiality, intellectual property ownership, compensation, and project scope will be communicated separately and may require a written agreement. You acknowledge that any work performed for the platform may be subject to intellectual property and confidentiality obligations.</p>
            <p>We reserve the right to accept or reject any application at our discretion. By submitting the form, you acknowledge that you have read and agreed to these Terms of Service.</p>
        </div>
    );

    const developerPrivacyContent = (
        <div className="space-y-4 text-justify text-gray-600 text-sm leading-relaxed">
            <p>When you submit a Developer application, we collect personal and professional information such as your contact details, technical skills, work experience, portfolio links, and resume. This information is used exclusively to evaluate your suitability for development opportunities and to communicate regarding potential engagement.</p>
            <p>We do not sell or share applicant information with unrelated third parties. Submitted information is stored securely and accessed only by authorized personnel. By submitting your application, you consent to the collection and use of your information in accordance with this Privacy Policy.</p>
        </div>
    );

    const getPolicyContent = (type) => {
        switch (type) {
            case 'terms':
                return {
                    title: 'Terms of Service',
                    icon: FileText,
                    content: (
                        <div className="space-y-4 text-justify text-gray-600">
                            <p><strong>1. Introduction</strong><br />Welcome to Bookify. By accessing our website, you agree to these Terms of Service. Please read them carefully.</p>
                            <p><strong>2. User Accounts</strong><br />You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account.</p>
                            <p><strong>3. Library Services</strong><br />Bookify provides access to physical and digital books. Users must comply with borrowing limits and return policies.</p>
                            <p><strong>4. Intellectual Property</strong><br />All content included on this site, such as text, graphics, logos, and software, is the property of Bookify or its content suppliers.</p>
                            <p><strong>5. Termination</strong><br />We reserve the right to terminate or suspend your account at our sole discretion, without notice, for conduct that we believe violates these Terms.</p>
                            <p><strong>6. Limitation of Liability</strong><br />Bookify shall not be liable for any direct, indirect, incidental, special, or consequential damages resulting from the use or inability to use our services.</p>
                            <p><strong>7. Changes to Terms</strong><br />We reserve the right to modify these terms at any time. Your continued use of the service constitutes acceptance of the new terms.</p>
                        </div>
                    )
                };
            case 'privacy':
                return {
                    title: 'Privacy Policy',
                    icon: Lock,
                    content: (
                        <div className="space-y-4 text-justify text-gray-600">
                            <p><strong>1. Information We Collect</strong><br />We collect information you provide directly to us, such as your name, email address, and reading preferences. We also collect usage data automatically.</p>
                            <p><strong>2. How We Use Your Information</strong><br />We use your information to provide, maintain, and improve our services, process transactions, and send you related information.</p>
                            <p><strong>3. Data Sharing</strong><br />We do not share your personal information with third parties except as described in this policy, such as with service providers who assist our operations.</p>
                            <p><strong>4. Data Security</strong><br />We use reasonable measures to help protect information about you from loss, theft, misuse and unauthorized access.</p>
                            <p><strong>5. Cookies</strong><br />We use cookies to improve your experience. You can set your browser to refuse all or some browser cookies.</p>
                            <p><strong>6. Your Rights</strong><br />You have the right to access, correct, or delete your personal information. Contact us for assistance.</p>
                        </div>
                    )
                };
            case 'security':
                return {
                    title: 'Security',
                    icon: Shield,
                    content: (
                        <div className="space-y-3.5 text-justify text-gray-600">
                            <p className="text-sm text-gray-400">Last Updated: February 2026</p>
                            <p>
                                At Bookifyyy, we are committed to protecting the security, confidentiality, and integrity of our users’ information. We implement appropriate technical and organizational measures to safeguard personal data against unauthorized access, misuse, loss, or disclosure. All data transmitted through our platform is protected using secure HTTPS encryption (SSL/TLS), ensuring that information shared between users and our servers remains secure.
                            </p>
                            <p>
                                User account credentials are handled with strict security standards. Passwords are securely encrypted using modern hashing techniques and are never stored in plain text. Access to administrative systems is restricted to authorized personnel only, and role-based access control mechanisms are used to ensure that users and staff can only access information relevant to their role. We also monitor login activity to detect and prevent suspicious or unauthorized access attempts.
                            </p>
                            <p>
                                For payment-related transactions, we rely on secure third-party payment providers that comply with industry security standards. We do not store full credit or debit card details on our servers. All payment transactions are encrypted and processed through trusted payment gateways to ensure financial data protection.
                            </p>
                            <p>
                                Our systems are regularly monitored and maintained to protect against potential threats such as malware, unauthorized access, data breaches, and other cyber risks. Security updates and patches are applied promptly to maintain platform integrity. In addition, we perform routine backups to ensure data availability and recovery in case of unexpected events.
                            </p>
                            <p>
                                While we take extensive measures to secure our platform, users also play an important role in maintaining account security. We encourage users to choose strong passwords, avoid sharing login credentials, and report any suspicious activity immediately. If a security vulnerability or issue is identified, users may contact us at <a href="mailto:bookifyyy@gmail.com" className="text-indigo-600 font-semibold">bookifyyy@gmail.com</a>, and we will investigate the matter promptly.
                            </p>
                            <p>
                                We may update this Security Policy from time to time to reflect improvements in our security practices or changes in applicable laws. Any updates will be published on this page with a revised “Last Updated” date. Bookify remains committed to maintaining a safe and secure digital environment for readers, publishers, and partners.
                            </p>
                        </div>
                    )
                };
            case 'status':
                return {
                    title: 'System Status',
                    icon: Activity,
                    content: (
                        <div className="space-y-8">
                            {/* Overall Status Card */}
                            <div className="p-6 bg-emerald-50/50 rounded-2xl border border-emerald-100 flex flex-col items-center text-center relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-12 bg-emerald-100 rounded-full blur-3xl opacity-30 -mr-6 -mt-6"></div>
                                <div className="relative z-10">
                                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100/80 text-emerald-700 text-sm font-bold mb-3">
                                        <span className="relative flex h-2.5 w-2.5">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600"></span>
                                        </span>
                                        Operational
                                    </div>
                                    <h3 className="text-2xl font-bold text-gray-900 mb-1">All Systems Operational</h3>
                                    <p className="text-gray-500">All services are running normally.</p>
                                </div>
                            </div>

                            {/* Service Grid */}
                            <div>
                                <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Service Status</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {[
                                        { name: 'Website', status: 'Operational', uptime: '100%', latency: '24ms' },
                                        { name: 'API Services', status: 'Operational', uptime: '99.9%', latency: '45ms' },
                                        { name: 'Database', status: 'Operational', uptime: '99.99%', latency: '12ms' },
                                        { name: 'Payment Gateway', status: 'Operational', uptime: '100%', latency: '89ms' },
                                        { name: 'Notifications', status: 'Operational', uptime: '100%', latency: '32ms' },
                                        { name: 'Search Engine', status: 'Operational', uptime: '99.8%', latency: '56ms' }
                                    ].map((service, idx) => (
                                        <div key={idx} className="p-4 rounded-xl border border-gray-100 bg-white hover:border-indigo-50 hover:shadow-sm transition-all group">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="font-bold text-gray-700">{service.name}</span>
                                                <CheckCircle size={16} className="text-emerald-500" />
                                            </div>
                                            <div className="flex items-center justify-between text-xs text-gray-400">
                                                <span>Uptime: <span className="text-gray-600 font-medium">{service.uptime}</span></span>
                                                <span>Avg. Latency: <span className="text-gray-600 font-medium">{service.latency}</span></span>
                                            </div>
                                            {/* Micro Bar Chart */}
                                            <div className="flex gap-0.5 mt-3 h-1">
                                                {[...Array(20)].map((_, i) => (
                                                    <div key={i} className={`flex-1 rounded-full ${Math.random() > 0.95 ? 'bg-amber-300' : 'bg-emerald-300'} opacity-60`}></div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )
                };
            case 'docs':
                return {
                    title: 'Documentation',
                    icon: FileText,
                    content: (
                        <div className="space-y-4 text-justify text-gray-600">
                            <h3 className="text-lg font-bold text-gray-900">Introduction</h3>
                            <p>
                                Bookifyyy is a cloud-based digital library system designed to support readers, educational institutions, publishers, and library administrators. The platform combines traditional library workflows with modern digital tools to create a seamless experience for managing books and memberships online. Bookifyyy enables users to browse a centralized catalog, issue and return books, track reading activity, manage subscriptions, and interact with a structured notification system. The platform is designed with scalability and security in mind, ensuring reliable performance for both small libraries and large institutions.
                            </p>

                            <h3 className="text-lg font-bold text-gray-900 mt-4">Getting Started</h3>
                            <p>
                                To start using Bookifyyy, users must create an account by registering with a valid email address and secure password. After registration, users can log in to access their personal dashboard. Email verification may be required to activate the account. Once logged in, users can:
                            </p>
                            <ul className="list-disc pl-5 space-y-1">
                                <li>Browse available books in the catalog</li>
                                <li>View book details and availability</li>
                                <li>Issue books based on membership limits</li>
                                <li>Monitor due dates and fines</li>
                                <li>Track reading progress and history</li>
                            </ul>
                            <p>
                                Premium membership options may be available for users who require additional borrowing limits, extended due dates, or priority access to certain resources. The onboarding experience is designed to be simple and intuitive, allowing new users to begin using the system without technical knowledge.
                            </p>

                            <h3 className="text-lg font-bold text-gray-900 mt-4">User Dashboard</h3>
                            <p>
                                The User Dashboard serves as the central hub for account management. It provides a real-time overview of user activity and membership details. From the dashboard, users can:
                            </p>
                            <ul className="list-disc pl-5 space-y-1">
                                <li>View currently issued books and their due dates</li>
                                <li>Check overdue items and pending fines</li>
                                <li>Monitor reading statistics and book history</li>
                                <li>Track subscription or membership validity</li>
                                <li>Access payment history and invoices</li>
                                <li>Manage notifications and alerts</li>
                            </ul>
                            <p>
                                The dashboard also displays important updates such as renewal reminders, overdue warnings, and new feature announcements. It is designed to give users full visibility into their library engagement. Users can update personal information, upload profile images, and manage security settings from the dashboard interface.
                            </p>

                            <h3 className="text-lg font-bold text-gray-900 mt-4">Book Catalog</h3>
                            <p>
                                The Book Catalog is the core of the Bookify platform. It provides a searchable and filterable database of available books. Users can search by Title, Author, Category, and Availability status.
                            </p>
                            <p>
                                Each book listing includes detailed information such as Book description, Author information, Number of available copies, Reviews and ratings, and Borrowing eligibility.
                            </p>
                            <p>
                                If a book is available, users may issue it instantly (subject to membership limits). If the book is currently unavailable, users may join a waitlist if enabled. The catalog is regularly maintained by moderators and administrators to ensure accuracy and quality of information.
                            </p>

                            <h3 className="text-lg font-bold text-gray-900 mt-4">Issuing and Returning Books</h3>
                            <p>
                                When a user issues a book, the system automatically assigns a due date based on the user’s membership plan. The borrowing period may vary depending on subscription level or institutional rules. Users are responsible for returning books before the due date to avoid penalties. If a book is returned late, the system may calculate fines according to the configured fine policy. The system provides automated reminders before due dates and alerts in case of overdue books. Once returned, the book is added to the user’s reading history for future reference. Renewals may be available if the book is not reserved by another user.
                            </p>

                            <h3 className="text-lg font-bold text-gray-900 mt-4">Payments and Membership</h3>
                            <p>
                                Bookify may offer multiple membership tiers, including free and premium plans. Each membership level defines borrowing limits, renewal privileges, and additional features. Users can Upgrade to premium plans, Renew expired memberships, View billing history, Download invoices, and Pay outstanding fines.
                            </p>
                            <p>
                                All payment transactions are processed through secure third-party gateways. Sensitive financial data is not stored directly on Bookifyyy servers. Membership benefits may include Higher borrowing limits, Extended due dates, Early access to new releases, and Priority support.
                            </p>

                            <h3 className="text-lg font-bold text-gray-900 mt-4">For Publishers and Moderators</h3>
                            <p>
                                Bookifyyy provides dedicated access for publishers and moderators to maintain high-quality content standards. Publishers can submit books for listing on the platform. Submitted entries may go through a moderation process before becoming publicly available. Publishers may also manage metadata, update descriptions, and track performance metrics. Moderators are responsible for reviewing submissions, maintaining catalog accuracy, handling reports, and ensuring content compliance with platform guidelines. Institutional partners such as schools, colleges, and libraries may request customized solutions, enterprise plans, or integration services.
                            </p>

                            <h3 className="text-lg font-bold text-gray-900 mt-4">Security and Privacy</h3>
                            <p>
                                Bookify prioritizes data protection and platform security. All communication between users and the platform is encrypted using secure protocols. Passwords are securely hashed, and administrative access is restricted using role-based access control. The system is continuously monitored for suspicious activity, and regular updates are applied to maintain performance and security standards. User privacy is respected, and personal data is handled in accordance with applicable data protection regulations. For more information, users are encouraged to review the Privacy Policy and Security Policy pages.
                            </p>

                            <h3 className="text-lg font-bold text-gray-900 mt-4">Support</h3>
                            <p>
                                Bookify provides user support through multiple channels to ensure smooth platform usage. Users can access Help Center articles, Frequently Asked Questions (FAQ), Email support, and Report issue forms. The support team works to resolve technical issues, account-related concerns, billing queries, and general questions in a timely manner. Users are encouraged to provide detailed information when reporting issues to help expedite resolution.
                            </p>

                            <h3 className="text-lg font-bold text-gray-900 mt-4">Updates and Improvements</h3>
                            <p>
                                Bookify is continuously evolving to improve performance, usability, and feature availability. Platform updates may include New dashboard features, Enhanced search capabilities, Improved analytics, Security enhancements, and UI/UX improvements. Users will be notified of major updates through platform announcements or email notifications.
                            </p>

                            <h3 className="text-lg font-bold text-gray-900 mt-4">Conclusion</h3>
                            <p>
                                Bookify aims to create a reliable, secure, and user-friendly digital library ecosystem that supports readers, publishers, and institutions alike. By combining modern technology with structured library workflows, Bookify ensures an efficient and scalable experience for all users.
                            </p>
                        </div>
                    )
                };
            case 'refund':
                return {
                    title: 'Refund Policy',
                    icon: FileQuestion,
                    content: (
                        <div className="space-y-4 text-justify text-gray-600">
                            <p className="text-sm text-gray-400">Last Updated: February 2026</p>
                            <p>
                                At Bookifyyy, we strive to provide a transparent and fair billing experience for all users. This Refund Policy explains the conditions under which refunds may be issued for membership plans, subscriptions, or other paid services offered through our platform. Membership and subscription fees paid to Bookify are generally non-refundable once the subscription period has begun. Users are encouraged to review plan details carefully before completing a purchase. However, refunds may be considered in cases of duplicate payments, accidental transactions, or technical errors that result in incorrect billing.
                            </p>
                            <p>
                                If a user experiences a billing issue or believes they have been charged incorrectly, they must contact our support team within a reasonable time frame from the date of the transaction. Refund requests should include relevant details such as the transaction ID, payment date, and a brief explanation of the issue. Each request will be reviewed individually, and refunds may be granted at our discretion depending on the circumstances.
                            </p>
                            <p>
                                In cases where a membership is canceled before the renewal date, the cancellation will prevent future charges, but the current subscription period will remain active until it expires. Bookifyyy does not typically provide partial refunds for unused time within an active subscription period. Refunds, when approved, will be processed through the original payment method used at the time of purchase. The time required for the refund to reflect in the user’s account may vary depending on the payment provider and banking institution.
                            </p>
                            <p>
                                Fines paid for overdue books or penalties are generally non-refundable, except in cases where the charge was applied due to a verified system error. Bookifyyy reserves the right to modify this Refund Policy at any time. Updates will be posted on this page with a revised “Last Updated” date.
                            </p>
                            <p>
                                For any refund-related inquiries, users may contact us at <a href="mailto:bookifyyy@gmail.com" className="text-indigo-600 font-semibold">bookifyyy@gmail.com</a>
                            </p>
                        </div>
                    )
                };
            case 'community':
                return {
                    title: 'Community Guidelines',
                    icon: Users,
                    content: (
                        <div className="space-y-4 text-justify text-gray-600">
                            <p>
                                At Bookifyyy, we believe that access to knowledge has the power to transform lives. We are building a modern library platform that blends technology with reading culture to create meaningful learning experiences for students, educators, institutions, and passionate readers. As we continue to grow, we are looking for dedicated and forward-thinking individuals who want to contribute to a purpose-driven mission.
                            </p>
                            <p>
                                Working at Bookifyyy means being part of a collaborative and supportive environment where ideas are valued and innovation is encouraged. We strive to create a workplace that promotes continuous learning, creativity, and professional development. Every team member plays an important role in shaping how knowledge is discovered, accessed, and shared across communities. </p>
                            <p>
                                We are interested in individuals who are passionate about education, technology, and building user-focused solutions. Whether your expertise lies in software development, design, content management, marketing, operations, or customer support, your contribution can help us enhance the library experience for thousands of users. </p>
                            <p>
                                At Bookifyyy, we emphasize integrity, quality, and long-term impact. We encourage team members to take ownership of their work, collaborate openly, and continuously seek better ways to serve our growing community.
                            </p>
                            <p>
                                f you are excited about building a smarter and more connected learning platform, we invite you to join Bookifyyy. You can submit your application through our Careers section or share your resume with our team. We carefully review every application and look forward to connecting with individuals who share our vision for the future of modern libraries.   </p>
                        </div>
                    )
                };

            case 'careers':
                return {
                    title: 'Careers',
                    icon: Users,
                    content: (
                        <div className="space-y-4 text-justify text-gray-600 leading-relaxed">
                            <p>At Bookifyyy, we believe that access to knowledge has the power to transform lives. We are building a modern library platform that blends technology with reading culture to create meaningful learning experiences for students, educators, institutions, and passionate readers. As we continue to grow, we are looking for dedicated and forward-thinking individuals who want to contribute to a purpose-driven mission.</p>
                            <p>Working at Bookifyyy means being part of a collaborative and supportive environment where ideas are valued and innovation is encouraged. We strive to create a workplace that promotes continuous learning, creativity, and professional development. Every team member plays an important role in shaping how knowledge is discovered, accessed, and shared across communities.</p>
                            <p>We are interested in individuals who are passionate about education, technology, and building user-focused solutions. Whether your expertise lies in software development, design, content management, marketing, operations, or customer support, your contribution can help us enhance the library experience for thousands of users.</p>
                            <p>At Bookifyyy, we emphasize integrity, quality, and long-term impact. We encourage team members to take ownership of their work, collaborate openly, and continuously seek better ways to serve our growing community.</p>
                            <p>If you are excited about building a smarter and more connected learning platform, we invite you to join Bookifyyy. You can submit your application through our Careers section or share your resume with our team. We carefully review every application and look forward to connecting with individuals who share our vision for the future of modern libraries.</p>
                        </div>
                    )
                };
            case 'support':
                return {
                    title: 'Support',
                    icon: Activity,
                    content: (
                        <div className="space-y-4 text-justify text-gray-600 leading-relaxed">
                            <p>At Bookifyyy, we are committed to providing reliable and timely assistance to ensure your library experience remains smooth and hassle-free. Whether you need help with membership plans, book reservations, account access, digital resources, or technical issues, our support team is here to assist you.</p>
                            <p>We understand that questions may arise at any time, and we strive to respond to all inquiries as quickly as possible. Our team carefully reviews every request and works to provide clear, accurate, and helpful solutions. Your satisfaction and trust are important to us, and we aim to resolve concerns efficiently while maintaining a professional and respectful approach.</p>
                            <p>If you require assistance, you can contact us through our support form or directly email us at <a href="mailto:bookifyyy@gmail.com" className="text-indigo-600 font-semibold hover:underline">bookifyyy@gmail.com</a>. We typically respond within 24 to 48 hours during business days. Bookifyyy is dedicated to ensuring that every reader, student, and institution receives the support they need.</p>
                        </div>
                    )
                };
            case 'help':
                return {
                    title: 'Help Center',
                    icon: FileQuestion,
                    content: (
                        <div className="space-y-4 text-justify text-gray-600 leading-relaxed">
                            <p>The Bookifyyy Help Center is designed to provide quick answers to common questions and guide you through using our platform effectively. Here, you can find helpful information about memberships, borrowing policies, digital access, account management, and general platform features.</p>
                            <p>Our Help Center is continuously updated to reflect improvements and new features on the platform. It serves as a self-service resource where you can easily find solutions without waiting for direct assistance. We aim to make information clear, accessible, and easy to understand for all users.</p>
                            <p>If you are unable to find the answer you are looking for, you may reach out to us at <a href="mailto:bookifyyy@gmail.com" className="text-indigo-600 font-semibold hover:underline">bookifyyy@gmail.com</a>, and our support team will be happy to assist you further. Bookifyyy is committed to creating a transparent and user-friendly library experience for everyone.</p>
                        </div>
                    )
                };
            case 'faq':
                return {
                    title: 'Frequently Asked Questions',
                    icon: FileQuestion,
                    content: (
                        <div className="space-y-4">
                            {[
                                {
                                    q: "What is Bookifyyy?",
                                    a: "Bookify is a modern digital library management platform that allows users to browse books, issue and return titles, manage memberships, and track reading activity online. It is designed for readers, publishers, and institutions."
                                },
                                {
                                    q: "How do I create an account?",
                                    a: "You can create an account by registering with your email address and setting a secure password. Once registered, you can log in and access your personal dashboard."
                                },
                                {
                                    q: "How can I borrow a book?",
                                    a: "To borrow a book, log in to your account, search for the desired title in the catalog, and click the issue or borrow option if the book is available. Your borrowing limit depends on your membership plan."
                                },
                                {
                                    q: "What happens if I return a book late?",
                                    a: "If a book is returned after the due date, a late fee may be applied according to the platform’s fine policy. You can view and pay any outstanding fines from your dashboard."
                                },
                                {
                                    q: "Can I renew a borrowed book?",
                                    a: "Yes, book renewals may be available if the book has not been reserved by another user. Renewal options can be accessed from your profile page."
                                },
                                {
                                    q: "What membership plans are available?",
                                    a: "Bookifyyy may offer free and premium membership plans. Premium memberships often include higher borrowing limits, extended due dates, and additional features."
                                },
                                {
                                    q: "How do I upgrade my membership?",
                                    a: "You can upgrade your membership from your dashboard by selecting the upgrade option and completing the payment process securely."
                                },
                                {
                                    q: "Is my personal information secure?",
                                    a: "Yes, Bookifyyy uses secure encryption and modern security practices to protect user data. Passwords are encrypted, and sensitive information is handled securely."
                                },
                                {
                                    q: "How can I contact support?",
                                    a: <span>If you need assistance, you can reach our support team via email at <a href="mailto:bookifyyy@gmail.com" className="text-indigo-600 font-semibold hover:underline">bookifyyy@gmail.com</a> or through the Help section on the platform.</span>
                                },
                                {
                                    q: "Can publishers list books on Bookifyyy?",
                                    a: "Yes, publishers and content partners may apply to list books on the platform. Submitted content may go through a review process before being published."
                                }
                            ].map((faq, index) => (
                                <div key={index} className="border border-gray-100 rounded-xl bg-gray-50/50 overflow-hidden">
                                    <button
                                        onClick={() => setOpenFaq(openFaq === index ? null : index)}
                                        className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-100/50 transition-colors"
                                    >
                                        <span className="font-bold text-gray-900 text-lg">{faq.q}</span>
                                        {openFaq === index ? (
                                            <ChevronUp className="text-indigo-600" size={20} />
                                        ) : (
                                            <ChevronDown className="text-gray-400" size={20} />
                                        )}
                                    </button>
                                    <div
                                        className={`grid transition-all duration-300 ease-in-out ${openFaq === index ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                                            }`}
                                    >
                                        <div className="overflow-hidden">
                                            <div className="p-4 pt-0 text-gray-600 leading-relaxed border-t border-gray-100/50">
                                                {faq.a}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
                };
            case 'cookie':
                return {
                    title: 'Cookie Policy',
                    icon: Cookie,
                    content: (
                        <div className="space-y-4 text-justify text-gray-600">
                            <p className="text-sm text-gray-400">Last Updated: February 2026</p>
                            <p>
                                This Cookie Policy explains how Bookify uses cookies and similar technologies to enhance user experience, improve platform performance, and ensure secure operation of our services. By using our website, you agree to the use of cookies in accordance with this policy. Cookies are small text files that are stored on your device when you visit a website. These files help us recognize your browser, remember your preferences, and provide a smoother and more personalized experience. Cookies allow us to maintain login sessions, remember selected settings, and analyze how users interact with our platform.
                            </p>
                            <p>
                                Bookifyyy uses cookies to support essential website functionality, such as secure authentication, session management, and protection against fraudulent activity. Without these cookies, certain parts of the platform may not function properly. We may also use performance and analytics cookies to understand how users navigate our website, which pages are visited most often, and how we can improve usability and performance.
                            </p>
                            <p>
                                In some cases, third-party services integrated into our platform, such as payment processors or analytics providers, may place cookies on your device. These third parties are responsible for their own privacy and cookie practices. Users have the ability to control or disable cookies through their browser settings. Most web browsers allow you to refuse cookies or delete existing ones. However, disabling cookies may affect the functionality and overall experience of the Bookify platform.
                            </p>
                            <p>
                                We may update this Cookie Policy from time to time to reflect changes in technology, legal requirements, or platform improvements. Any updates will be posted on this page with a revised “Last Updated” date. If you have questions regarding our use of cookies, you may contact us at <a href="mailto:bookifyyy@gmail.com" className="text-indigo-600 font-semibold">bookifyyy@gmail.com</a>
                            </p>
                        </div>
                    )
                };
            case 'partner':
                return {
                    title: 'Partner with Us',
                    icon: Handshake,
                    content: (
                        <div className="space-y-6">
                            <form className="space-y-5" onSubmit={(e) => handleSubmit(e, 'partner')}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Institution Name</label>
                                        <input type="text" name="institutionName" className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 mt-2 focus:bg-white focus:border-white-500 focus:ring-4 focus:ring-white/10 transition-all font-medium text-gray-900 placeholder-gray-400" required />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Official Email</label>
                                        <input type="email" name="email" className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 mt-2 focus:bg-white focus:border-white-500 focus:ring-4 focus:ring-white/10 transition-all font-medium text-gray-900 placeholder-gray-400" required />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">City / State</label>
                                        <input type="text" name="location" className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 mt-2 focus:bg-white focus:border-white-500 focus:ring-4 focus:ring-white/10 transition-all font-medium text-gray-900 placeholder-gray-400" required />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Institution Type</label>
                                        <div className="relative">
                                            <select name="institutionType" defaultValue="" className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 mt-2 focus:bg-white focus:border-white-500 focus:ring-4 focus:ring-white/10 transition-all font-medium text-gray-900 appearance-none cursor-pointer">
                                                <option value="" disabled></option>
                                                <option>School</option>
                                                <option>University</option>
                                                <option>Public Library</option>
                                                <option>Other</option>
                                            </select>
                                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Number of Members</label>
                                        <div className="relative">
                                            <select name="memberCount" defaultValue="" className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 mt-2 focus:bg-white focus:border-white-500 focus:ring-4 focus:ring-white/10 transition-all font-medium text-gray-900 appearance-none cursor-pointer">
                                                <option value="" disabled></option>
                                                <option>1-10 members</option>
                                                <option>10-30 members</option>
                                                <option>More than 30 members</option>
                                            </select>
                                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Purpose</label>
                                        <div className="relative">
                                            <select name="purpose" defaultValue="" className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 mt-2 focus:bg-white focus:border-white-500 focus:ring-4 focus:ring-white/10 transition-all font-medium text-gray-900 appearance-none cursor-pointer">
                                                <option value="" disabled></option>
                                                <option>Bulk Access</option>
                                                <option>Digital Library</option>
                                                <option>Events</option>
                                                <option>Workshops</option>
                                            </select>
                                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Message / Proposal</label>
                                    <textarea name="message" className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 mt-2 focus:bg-white focus:border-white-500 focus:ring-4 focus:ring-white/10 transition-all font-medium h-32 resize-none text-gray-900 placeholder-gray-400"></textarea>
                                </div>
                                <div className="flex items-center gap-3  p-1 rounded-xl">
                                    <input type="checkbox" id="copyright" className="w-5 h-5 rounded text-amber-600 focus:ring-amber-500 border-gray-300" required />
                                    <label htmlFor="copyright" className="text-sm font-medium text-gray-700 cursor-pointer">
                                        I confirm I represent this institution and accept the <span className="text-indigo-600 hover:text-indigo-700" onClick={(e) => { e.preventDefault(); setNestedPopup('terms'); }}>Terms</span> and <span className="text-indigo-600 hover:text-indigo-700" onClick={(e) => { e.preventDefault(); setNestedPopup('privacy'); }}>Privacy Policy</span>.
                                    </label>
                                </div>
                                <button type="submit" className="w-full py-4 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-200 transform active:scale-[0.98]">
                                    Submit Application
                                </button>
                            </form>
                        </div>
                    )
                };
            case 'advertise':
                return {
                    title: 'ADVERTISE WITH US',
                    icon: Megaphone,
                    content: (
                        <div className="space-y-6">
                            <form className="space-y-5" onSubmit={(e) => handleSubmit(e, 'advertise')}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="space-y-1.5 ">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1 ">Brand Name</label>
                                        <input type="text" name="brandName" className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 mt-2 focus:bg-white focus:border-white-500 focus:ring-4 focus:ring-white/10 transition-all font-medium text-gray-900 placeholder-gray-400" required />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Contact Person</label>
                                        <input type="text" name="contactPerson" className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 mt-2 focus:bg-white focus:border-white-500 focus:ring-4 focus:ring-white/10 transition-all font-medium text-gray-900 placeholder-gray-400" required />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Email</label>
                                        <input type="email" name="email" className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 mt-2 focus:bg-white focus:border-white-500 focus:ring-4 focus:ring-white/10 transition-all font-medium text-gray-900 placeholder-gray-400" required />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Ad Type</label>
                                        <div className="relative">
                                            <select name="adType" defaultValue="" className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 mt-2 focus:bg-white focus:border-white-500 focus:ring-4 focus:ring-white/10 transition-all font-medium text-gray-900 appearance-none cursor-pointer">
                                                <option value="" disabled></option>
                                                <option>Homepage</option>
                                                <option>Featured Book</option>
                                                <option>Newsletter</option>
                                            </select>
                                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Duration</label>
                                        <div className="relative">
                                            <select name="duration" defaultValue="" className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 mt-2 focus:bg-white focus:border-white-500 focus:ring-4 focus:ring-white/10 transition-all font-medium text-gray-900 appearance-none cursor-pointer">
                                                <option value="" disabled></option>
                                                <option>1 week</option>
                                                <option>1 month</option>
                                                <option>More than 1 month</option>
                                            </select>
                                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Budget Range</label>
                                        <div className="relative">
                                            <select name="budgetRange" defaultValue="" className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 mt-2 focus:bg-white focus:border-white-500 focus:ring-4 focus:ring-white/10 transition-all font-medium text-gray-900 appearance-none cursor-pointer">
                                                <option value="" disabled></option>
                                                <option>1-10 rupee</option>
                                                <option>10-30 rupee</option>
                                                <option>More than 30 rupee</option>
                                            </select>
                                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Description</label>
                                    <textarea name="description" className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 mt-2 focus:bg-white focus:border-white-500 focus:ring-4 focus:ring-white/10 transition-all font-medium h-40 resize-none text-gray-900 placeholder-gray-400"></textarea>
                                </div>
                                <div className="flex items-center gap-3  p-1 rounded-xl">
                                    <input type="checkbox" id="copyright" className="w-5 h-5 rounded text-amber-600 focus:ring-amber-500 border-gray-300" required />
                                    <label htmlFor="copyright" className="text-sm font-medium text-gray-700 cursor-pointer">
                                        I confirm I represent this institution and accept the <span className="text-indigo-600 hover:text-indigo-700" onClick={(e) => { e.preventDefault(); setNestedPopup('advertise_terms'); }}>Terms</span> and <span className="text-indigo-600 hover:text-indigo-700" onClick={(e) => { e.preventDefault(); setNestedPopup('advertise_privacy'); }}>Privacy Policy</span>.
                                    </label>
                                </div>
                                <button type="submit" className="w-full py-4 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-200 transform active:scale-[0.98]">
                                    Submit Application
                                </button>
                            </form>
                        </div>
                    )
                };
            case 'publisher':
                return {
                    title: 'Become a Publisher',
                    icon: Share2,
                    content: (
                        <div className="space-y-6">
                            <form className="space-y-5" onSubmit={(e) => handleSubmit(e, 'publisher')}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Publisher Name</label>
                                        <input type="text" name="publisherName" className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 mt-2 focus:bg-white focus:border-white-500 focus:ring-4 focus:ring-white/10 transition-all font-medium text-gray-900 placeholder-gray-400" required />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Author Name</label>
                                        <input type="text" name="authorName" className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 mt-2 focus:bg-white focus:border-white-500 focus:ring-4 focus:ring-white/10 transition-all font-medium text-gray-900 placeholder-gray-400" required />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Email</label>
                                        <input type="email" name="email" className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 mt-2 focus:bg-white focus:border-white-500 focus:ring-4 focus:ring-white/10 transition-all font-medium text-gray-900 placeholder-gray-400" required />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Genres</label>
                                        <input type="text" name="genres" className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 mt-2 focus:bg-white focus:border-white-500 focus:ring-4 focus:ring-white/10 transition-all font-medium text-gray-900 placeholder-gray-400" required />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">ISBN (Optional)</label>
                                        <input type="text" name="isbn" className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 mt-2 focus:bg-white focus:border-white-500 focus:ring-4 focus:ring-white/10 transition-all font-medium text-gray-900 placeholder-gray-400" required />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Type</label>
                                        <div className="relative">
                                            <select name="publisherType" defaultValue="" className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 mt-2 focus:bg-white focus:border-white-500 focus:ring-4 focus:ring-white/10 transition-all font-medium text-gray-900 appearance-none cursor-pointer">
                                                <option value="" disabled></option>
                                                <option>Individual</option>
                                                <option>Company</option>
                                            </select>
                                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                                        </div>
                                    </div>

                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Short Description</label>
                                    <textarea name="description" className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 mt-2 focus:bg-white focus:border-white-500 focus:ring-4 focus:ring-white/10 transition-all font-medium h-35 resize-none text-gray-900 placeholder-gray-400"></textarea>
                                </div>
                                <div className="flex items-center gap-3  p-1 rounded-xl">
                                    <input type="checkbox" id="copyright" className="w-5 h-5 rounded text-amber-600 focus:ring-amber-500 border-gray-300" required />
                                    <label htmlFor="copyright" className="text-sm font-medium text-gray-700 cursor-pointer">
                                        I confirm I represent this institution and accept the <span className="text-indigo-600 hover:text-indigo-700" onClick={(e) => { e.preventDefault(); setNestedPopup('publisher_terms'); }}>Terms</span> and <span className="text-indigo-600 hover:text-indigo-700" onClick={(e) => { e.preventDefault(); setNestedPopup('publisher_privacy'); }}>Privacy Policy</span>.
                                    </label>
                                </div>
                                <button type="submit" className="w-full py-4 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-200 transform active:scale-[0.98]">
                                    Submit Application
                                </button>
                            </form>
                        </div>
                    )
                };
            case 'moderator':
                return {
                    title: 'Become a Moderator',
                    icon: ShieldCheck,
                    content: (
                        <div className="space-y-6">

                            <form className="space-y-5" onSubmit={(e) => handleSubmit(e, 'moderator')}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Name</label>
                                        <input
                                            type="text"
                                            name="name"
                                            defaultValue={user?.name || ''}
                                            readOnly={!!user}
                                            className={`w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 mt-2 focus:bg-white focus:border-white-500 focus:ring-4 focus:ring-white/10 transition-all font-medium text-gray-900 placeholder-gray-400 ${user ? 'cursor-not-allowed opacity-70' : ''}`}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Email</label>
                                        <input type="email" name="email" className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white mt-2 focus:border-white-500 focus:ring-4 focus:ring-white/10 transition-all font-medium text-gray-900 placeholder-gray-400" required />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Education</label>
                                        <input type="text" name="education" className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white mt-2 focus:border-white-500 focus:ring-4 focus:ring-white/10 transition-all font-medium text-gray-900 placeholder-gray-400" required />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Profile URL</label>
                                        <input type="url" name="profileUrl" className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white mt-2 focus:border-white-500 focus:ring-4 focus:ring-white/10 transition-all font-medium text-gray-900 placeholder-gray-400" />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Reason</label>
                                    <textarea name="reason" className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white mt-2 focus:border-white-500 focus:ring-4 focus:ring-white/10 transition-all font-medium h-40 resize-none text-gray-900 placeholder-gray-400" required></textarea>
                                </div>
                                <div className="flex items-center gap-3  p-1 rounded-xl">
                                    <input type="checkbox" id="copyright" className="w-5 h-5 rounded text-amber-600 focus:ring-amber-500 border-gray-300" required />
                                    <label htmlFor="copyright" className="text-sm font-medium text-gray-700 cursor-pointer">
                                        I confirm I represent this institution and accept the <span className="text-indigo-600 hover:text-indigo-700" onClick={(e) => { e.preventDefault(); setNestedPopup('moderator_terms'); }}>Terms</span> and <span className="text-indigo-600 hover:text-indigo-700" onClick={(e) => { e.preventDefault(); setNestedPopup('moderator_privacy'); }}>Privacy Policy</span>.
                                    </label>
                                </div>
                                <button type="submit" className="w-full py-4 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-200 transform active:scale-[0.98]">
                                    Submit Application
                                </button>
                            </form>
                        </div>
                    )
                };
            case 'developer':
                return {
                    title: 'Become a Developer',
                    icon: Code,
                    content: (
                        <div className="space-y-6">

                            <form className="space-y-5" onSubmit={(e) => handleSubmit(e, 'developer')}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Name</label>
                                        <input
                                            type="text"
                                            name="name"
                                            defaultValue={user?.name || ''}
                                            readOnly={!!user}
                                            className={`w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 mt-2 focus:bg-white focus:border-white-500 focus:ring-4 focus:ring-white/10 transition-all font-medium text-gray-900 placeholder-gray-400 ${user ? 'cursor-not-allowed opacity-70' : ''}`}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Email</label>
                                        <input type="email" name="email" className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 mt-2 focus:bg-white focus:border-white-500 focus:ring-4 focus:ring-white/10 transition-all font-medium text-gray-900 placeholder-gray-400" required />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Tech Stack</label>
                                    <textarea name="techStack" className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 mt-2 focus:bg-white focus:border-white-500 focus:ring-4 focus:ring-white/10 transition-all font-medium h-13 resize-none text-gray-900 placeholder-gray-400" required></textarea>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Github</label>
                                        <input type="url" name="github" className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 mt-2 focus:bg-white focus:border-white-500 focus:ring-4 focus:ring-white/10 transition-all font-medium text-gray-900 placeholder-gray-400" required />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Availability</label>
                                        <div className="relative">
                                            <select name="availability" defaultValue="" className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 mt-2 focus:bg-white focus:border-white-500 focus:ring-4 focus:ring-white/10 transition-all font-medium text-gray-900 appearance-none cursor-pointer">
                                                <option value="" disabled></option>
                                                <option>Full-time</option>
                                                <option>Part-time</option>
                                                <option>Contract</option>
                                            </select>
                                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Frontend Skills</label>
                                        <input type="text" name="frontendSkills" className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 mt-2 focus:bg-white focus:border-white-500 focus:ring-4 focus:ring-white/10 transition-all font-medium text-gray-900 placeholder-gray-400" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Backend Skills</label>
                                        <input type="text" name="backendSkills" className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 mt-2 focus:bg-white focus:border-white-500 focus:ring-4 focus:ring-white/10 transition-all font-medium text-gray-900 placeholder-gray-400" />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Resume Upload (PDF)</label>
                                    <input type="file" name="cv" accept=".pdf" className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 mt-2 focus:bg-white focus:border-white-500 focus:ring-4 focus:ring-white/10 transition-all font-medium text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200" required />
                                </div>

                                <div className="flex items-center gap-3  p-1 rounded-xl">
                                    <input type="checkbox" id="copyright" className="w-5 h-5 rounded text-amber-600 focus:ring-amber-500 border-gray-300" required />
                                    <label htmlFor="copyright" className="text-sm font-medium text-gray-700 cursor-pointer">
                                        I confirm I represent this institution and accept the <span className="text-indigo-600 hover:text-indigo-700" onClick={(e) => { e.preventDefault(); setNestedPopup('developer_terms'); }}>Terms</span> and <span className="text-indigo-600 hover:text-indigo-700" onClick={(e) => { e.preventDefault(); setNestedPopup('developer_privacy'); }}>Privacy Policy</span>.
                                    </label>
                                </div>
                                <button type="submit" className="w-full py-4 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-200 transform active:scale-[0.98]">
                                    Submit Application
                                </button>
                            </form>
                        </div>
                    )
                };
            default:
                return {
                    title: 'Policy',
                    icon: FileText,
                    content: <p>Content not available.</p>
                };
        }
    };

    const policy = getPolicyContent(type);
    const Icon = policy.icon;
    const isApplicationForm = ['partner', 'advertise', 'publisher', 'moderator', 'developer'].includes(type);

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
            <div
                className={`bg-white rounded-3xl shadow-2xl w-full flex flex-col animate-in zoom-in-95 duration-200 ${isApplicationForm ? 'max-w-2xl max-h-[85vh]' : 'max-w-6xl max-h-[75vh]'
                    }`}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                {/* Header */}
                <div className={`px-8 pt-7 pb-4 border-b border-gray-100 flex items-center bg-gray-50/50 rounded-t-3xl relative ${isApplicationForm ? 'justify-center' : 'justify-between'}`}>
                    {isApplicationForm ? (
                        <h2 className="text-2xl font-bold text-gray-900 uppercase tracking-wider text-center">{policy.title}</h2>
                    ) : (
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                                <Icon size={24} />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900">{policy.title}</h2>
                        </div>
                    )}
                    <button
                        onClick={onClose}
                        className={`p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-400 hover:text-gray-600 ${isApplicationForm ? 'absolute right-6 top-6' : ''}`}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-8 overflow-y-auto hide-scrollbar text-base leading-relaxed">
                    {policy.content}
                </div>

                {/* Footer */}
                {!isApplicationForm && (
                    <div className="p-4 border-t border-gray-100 bg-gray-50/50 rounded-b-3xl flex justify-end">
                        <button
                            onClick={onClose}
                            className="px-6 py-2.5 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-xl transition-colors"
                        >
                            Close
                        </button>
                    </div>
                )}
            </div>

            {/* Nested Policy Popup */}
            {nestedPopup && (
                <div className="absolute inset-0 z-[70] flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm animate-in fade-in duration-200" onClick={(e) => { e.stopPropagation(); setNestedPopup(null); }}>
                    <div
                        className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[70vh] flex flex-col animate-in zoom-in-95 duration-200 border border-gray-100"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-gray-100 mt-1 flex items-center justify-center bg-gray-50/50 rounded-t-3xl relative">
                            <h3 className="text-lg font-bold text-gray-900 uppercase tracking-wider text-center">
                                {
                                    nestedPopup === 'terms' ||
                                        nestedPopup === 'advertise_terms' ||
                                        nestedPopup === 'publisher_terms' ||
                                        nestedPopup === 'moderator_terms' ||
                                        nestedPopup === 'developer_terms'
                                        ? 'Terms of Service' : 'Privacy Policy'
                                }
                            </h3>
                            <button
                                onClick={() => setNestedPopup(null)}
                                className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-400 hover:text-gray-600 absolute right-4 top-1/2 -translate-y-1/2"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="px-6 py-5 overflow-y-auto hide-scrollbar">
                            {
                                nestedPopup === 'terms' ? termsContent :
                                    nestedPopup === 'privacy' ? privacyContent :
                                        nestedPopup === 'advertise_terms' ? advertiseTermsContent :
                                            nestedPopup === 'advertise_privacy' ? advertisePrivacyContent :
                                                nestedPopup === 'publisher_terms' ? publisherTermsContent :
                                                    nestedPopup === 'publisher_privacy' ? publisherPrivacyContent :
                                                        nestedPopup === 'moderator_terms' ? moderatorTermsContent :
                                                            nestedPopup === 'moderator_privacy' ? moderatorPrivacyContent :
                                                                nestedPopup === 'developer_terms' ? developerTermsContent :
                                                                    developerPrivacyContent
                            }
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FooterPolicyModal;