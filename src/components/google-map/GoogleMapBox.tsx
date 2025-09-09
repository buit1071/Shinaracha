"use client";

import { GoogleMap, Marker, useLoadScript } from "@react-google-maps/api";
import { useMemo } from "react";

type Props = {
    lat: number;
    lng: number;
};

export default function GoogleMapBox({ lat, lng }: Props) {
    const { isLoaded } = useLoadScript({
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
    });

    const center = useMemo(() => ({ lat, lng }), [lat, lng]);

    if (!isLoaded) return <div>Loading...</div>;

    return (
        <GoogleMap
            center={center}
            zoom={13}
            mapContainerStyle={{ width: "100%", height: "100%" }}
        >
            <Marker position={center} />
        </GoogleMap>
    );
}
