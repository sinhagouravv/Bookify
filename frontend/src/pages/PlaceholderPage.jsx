
const PlaceholderPage = ({ title }) => {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4 text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">{title}</h1>
            <p className="text-lg text-gray-600 max-w-md">
                This page is currently under construction. Please check back later!
            </p>
        </div>
    );
};

export default PlaceholderPage;
