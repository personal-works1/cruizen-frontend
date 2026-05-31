import AccountCircleIcon from "@mui/icons-material/AccountCircle";

export default function UserAvatar({ avatar_url, size = 40, color = "inherit", onClick })  {
  if (avatar_url && typeof avatar_url === "string" && avatar_url.trim() !== "") {
    return (
      <img
        src={avatar_url}
        alt="avatar"
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          objectFit: "cover",
          flexShrink: 0,
          display: "block",
          cursor: onClick ? "pointer" : "default"
        }}

        onClick={onClick}
        onError={(e) => {
          e.target.style.display = "none"
        }}
      />
    );
  }

  return (
    <AccountCircleIcon  onClick={onClick} sx={{ fontSize: size, color, flexShrink: 0, cursor: onClick ? "pointer" : "default" }} />
  );
}