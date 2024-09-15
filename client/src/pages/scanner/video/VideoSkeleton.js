import './video.css'

const VideoSkeleton = ({ error }) => (
    <div>
        {error ?
            ""
            :
            <div>

            </div>
        }
    </div>
);

export default VideoSkeleton;