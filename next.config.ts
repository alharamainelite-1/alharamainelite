import type {NextConfig} from 'next';

const nextConfig:NextConfig={
  images:{
    remotePatterns:[
      {protocol:'https',hostname:'images.unsplash.com'},
      {protocol:'https',hostname:'images.pexels.com'},
      {protocol:'https',hostname:'content.skyscnr.com'},
      {protocol:'https',hostname:'umrahtransit.com'},
      {protocol:'https',hostname:'image.idntimes.com'},
      {protocol:'https',hostname:'scenenow.com'},
    ],
  },
};

export default nextConfig;
