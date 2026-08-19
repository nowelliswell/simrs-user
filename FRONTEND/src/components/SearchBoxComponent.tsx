import { useSearchParams } from "react-router-dom"
import { useState, useEffect } from "react"

function SearchBoxComponent({ placeHolder }: { placeHolder: string }) {
    const [searchParams, setSearchParams] = useSearchParams();
    const [searchValue, setSearchValue] = useState(searchParams.get('search') || '');

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            const params = new URLSearchParams(searchParams);
            if (searchValue) {
                params.set('search', searchValue);
                params.set('page', '1'); // Reset ke halaman 1 saat search
            } else {
                params.delete('search');
            }
            setSearchParams(params);
        }, 500);

        return () => clearTimeout(timer);
    }, [searchValue]);

    return (
        <div className="w-full sm:w-[24rem]">
            <input
                id="q"
                placeholder={placeHolder}
                type="search"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="px-3 py-2.5 outline-none border-gray-200 border rounded-lg bg-gray-50 w-full text-sm sm:text-base"
            />
        </div>
    )
}

export default SearchBoxComponent