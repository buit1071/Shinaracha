import * as React from "react";

import { useCurrentUser } from "@/hooks/useCurrentUser";
type Props = {
    jobId: string;
    equipment_id: string;
    name: string;
    onBack: () => void;
};

export default function Form1_3({ jobId, equipment_id, name, onBack }: Props) {
    const user = useCurrentUser();
    const username = React.useMemo(
        () => (user ? `${user.first_name_th} ${user.last_name_th}` : ""),
        [user]
    );
    
    return(
        <></>
    )
}