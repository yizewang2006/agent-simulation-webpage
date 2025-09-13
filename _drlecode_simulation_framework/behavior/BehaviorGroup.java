package behavior;

import java.util.ArrayList;


public class BehaviorGroup 
{
	//Property that behavior group will act on
	//1. Position
	//2. Angle
	//3. Speed
	
	public double extracted_p = 0;
	
	public ArrayList<Behavior> behavior_set = new ArrayList<Behavior>();
	
	//hard code
	public BehaviorGroup(double extract_property)
	{
		this.extracted_p = extract_property;
	}
	
	
}
