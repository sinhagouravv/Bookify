import { Shield, Users, Globe, BookOpen, Clock, Award } from 'lucide-react';

const About = () => {
    return (
        <div id="about" className="scroll-mt-2 bg-white min-h-screen flex items-center py-20 md:py-32 px-6 md:px-10">
            <div className="max-w-7xl mx-auto w-full">
                {/* Heading */}
                <div className="text-center mb-10">
                    <h1 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">About Us</h1>
                    {/* <div className="w-20 h-1 bg-indigo-600 mx-auto mb-6"></div> */}
                </div>

                {/* Content About Website */}
                <div className="max-w-7xl mx-auto mb-7 text-justify space-y-3">
                    <p className="text-base text-gray-700 leading-relaxed">
                        Bookifyyy is a modern library platform dedicated to making knowledge accessible and easy to explore. We combine traditional reading culture with digital convenience to create a seamless experience for students, educators, institutions, and readers. Our platform simplifies how people discover, borrow, and manage books. Whether you are looking for academic resource, research material, fiction, or competitive exam preparation, Bookifyyy provides a well structured, user-friendly environment to support your learning journey.</p>

                    <div>
                        {/* <h3 className="text-xl font-bold text-gray-900 mb-2">Our Mission</h3> */}
                        <p className="text-base text-gray-700 leading-relaxed">
                            Our mission is to promote a strong reading culture by providing reliable access to quality books and digital resources. We aim to make learning affordable, organized, and available to everyone.
                            Our envision is connected learning ecosystem where libraries are not limited by physical boundaries. Our goal is to build a platform that empowers readers across cities and institutions through technology-driven library solutions.
                            Our envision is to connected learning ecosystem where libraries are not limited by physical boundaries.

                        </p>
                    </div>

                    <div>
                        {/* <h3 className="text-xl font-bold text-gray-900 mb-2">Our Vision</h3> */}
                        <p className="text-base text-gray-700 leading-relaxed">
                            Our goal is to build a platform that empowers readers across cities and institutions through technology-driven solutions that enhance accessibility and convenience. Bookify offers a diverse collection of books across genres, including academic, research, fiction, and professional materials to support lifelong learning and academic growth. Our membership plans are designed for individuals, students, and institutions, providing flexible options and digital access for seamless, efficient, and enriching reading experience.
                        </p>
                    </div>

                    <div>
                        {/* <h3 className="text-xl font-bold text-gray-900 mb-2">What We Offer</h3> */}
                        <p className="text-base text-gray-700 leading-relaxed">
                            We collaborate with publishers, schools, and organizations to expand access to carefully curated content while maintaining high standards of authenticity and quality across all categories and formats. We are committed to protecting intellectual property rights, safeguarding user data, and fostering a secure, inclusive, and respectful reading environment for our growing global community. Every features of our platform is thoughtfully designed with reliability, transparency, innovation, and long-term user trust in mind.
                        </p>
                    </div>



                    <div>
                        {/* <h3 className="text-xl font-bold text-gray-900 mb-2">Join Our Community</h3> */}
                        <p className="text-base text-gray-700 leading-relaxed">
                            Bookify is more than a library platform—it is a growing community of learners and readers driven by curiosity and a shared passion for lifelong knowledge. We invite you to explore our collection, become a member, be part of a smarter, more connected way to access knowledge, discover new ideas, and embrace meaningful lifelong learning option.    </p>
                    </div>
                </div>


                {/* Stats */}
                {/* <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-5 max-w-4xl mx-auto">
                    {[
                        { number: "10,000+", label: "Books Available" },
                        { number: "5,000+", label: "Active Members" },
                        { number: "50+", label: "Cities Served" },
                        { number: "98%", label: "Satisfaction Rate" }
                    ].map((stat, index) => (
                        <div key={index} className="text-center p-4 bg-gray-50 rounded-lg">
                            <div className="text-3xl font-bold text-indigo-600 mb-1">{stat.number}</div>
                            <div className="text-sm text-gray-600">{stat.label}</div>
                        </div>
                    ))}
                </div> */}

                {/* Core Values - Horizontal */}
                <div className="mb-8">
                    {/* <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">Why Choose Bookify</h2> */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[
                            {
                                icon: Shield,
                                title: "Secure & Reliable",
                                desc: "Your data protected with enterprise-grade security"
                            },
                            {
                                icon: Clock,
                                title: "24/7 Access",
                                desc: "Browse and borrow anytime, from anywhere"
                            },
                            {
                                icon: BookOpen,
                                title: "Vast Collection",
                                desc: "Thousands of books across all genres"
                            },
                            {
                                icon: Users,
                                title: "Community Driven",
                                desc: "Join a thriving community of readers"
                            },
                            {
                                icon: Globe,
                                title: "Global Platform",
                                desc: "Access your library across multiple cities"
                            },
                            {
                                icon: Award,
                                title: "Award Winning",
                                desc: "Recognized for excellence in library tech"
                            }
                        ].map((item, index) => (
                            <div key={index} className="bg-white border border-gray-200 p-6 rounded-lg hover:shadow-lg transition-all hover:border-indigo-300">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-9 h-9 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <item.icon size={18} />
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
                                </div>
                                <p className="text-sm text-gray-600">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Button */}
                <div className="text-center">
                    <button
                        onClick={() => document.getElementById('catalog').scrollIntoView({ behavior: 'smooth' })}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-10 py-3.5 rounded-lg font-semibold transition-all shadow-lg hover:shadow-xl"
                    >
                        Explore Our Collection
                    </button>
                </div>
            </div>
        </div>
    );
};

export default About;
