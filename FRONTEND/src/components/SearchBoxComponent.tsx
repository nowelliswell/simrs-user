import { Form } from "react-router-dom"

function SearchBoxComponent({ placeHolder }: { placeHolder: string }) {
    return (
        <Form id="search-form" role="search" className="w-[24rem]">
            <input
                id="q"
                placeholder={placeHolder}
                type="search"
                name="search"
                className="px-2 py-2 outline-none border-gray-200 border rounded-md bg-gray-50 w-full"
            />
        </Form>
    )
}

export default SearchBoxComponent