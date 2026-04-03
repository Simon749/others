
import React, { useEffect, useState } from "react";
import { AllCommunityModule } from 'ag-grid-community';
import { AgGridProvider } from 'ag-grid-react';
import { AgGridReact } from 'ag-grid-react';
import { Button } from "@/components/ui/button";
import { Search, Trash2Icon } from "lucide-react";

const pagination =  true;
const paginationPageSize = 10;
const paginationPageSelector = [25, 50, 100];


function StudentListTable({ studentList }) {

    const CustomButtons = (props) => {
        return <Button variant="destructive"><Trash2Icon/></Button>
    };

    const modules = [AllCommunityModule];
    const [colDefs, setColDefs] = useState([
        { headerName: "id", field: "id" },
        { headerName: "Name", field: "name" },
        { headerName: "Grade", field: "class" },
        { headerName: "Age", field: "age" },
        { headerName: "Actions", field: "actions", cellRenderer: CustomButtons }
    ]);

    const [rowData, setRowData] = useState();

    useEffect(() => {
        studentList && setRowData(studentList);
    }, [studentList]);

    return (
        <div className="my-7">
            <AgGridProvider modules={modules}>
                {/* Data Grid will fill the size of the parent container */}
                <div className="ag-theme-alpine"   style={{ height: 500 }}>
                    <div className="p-2 rounded-lg border shadow-sm flex gap-2 mb-4 max-w-sm">
                        <Search />
                        <input type="text" placeholder="Search..." className="outline-none w-full" />
                    </div>
                    <AgGridReact
                        rowData={rowData}
                        columnDefs={colDefs}
                        pagination={pagination}
                        paginationPageSize={paginationPageSize}
                        paginationPageSelector={paginationPageSelector}

                    />
                </div>
            </AgGridProvider>
        </div>
    )
}

export default StudentListTable;